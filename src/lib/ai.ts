import {google} from '@ai-sdk/google'
import type {LanguageModel} from 'ai'

/**
 * The Gemini free tier allows only a few requests per minute per model, but each model has its own quota.
 * REZ keeps an ordered list of models and moves to the next one when a model is rate limited or overloaded.
 * Override with comma-separated env vars, e.g. GEMINI_CHAT_MODELS=gemini-3.8-flash,gemini-2.5-flash
 */
function list(env: string | undefined, fallback: string[]) {
  const v = env?.split(',').map((s) => s.trim()).filter(Boolean)
  return v && v.length ? v : fallback
}

export const CHAT_MODELS = list(process.env.GEMINI_CHAT_MODELS, [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
])

export const EXTRACT_MODELS = list(process.env.GEMINI_EXTRACT_MODELS, [
  'gemini-2.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
])

/** Model name -> epoch ms until which we avoid it. Lives for the life of the server process. */
const cooldown = new Map<string, number>()

export function isRetryableAiError(err: unknown): boolean {
  const e = err as {isRetryable?: boolean; lastError?: {isRetryable?: boolean}; statusCode?: number; message?: string}
  if (e?.isRetryable || e?.lastError?.isRetryable) return true
  if (e?.statusCode && [408, 429, 500, 502, 503, 504].includes(e.statusCode)) return true
  return /429|quota|rate.?limit|high demand|overloaded|unavailable|503|ECONNRESET|fetch failed|timeout/i.test(String(e?.message || err))
}

/** Seconds Gemini asked us to wait, if it said so. */
function retryDelayMs(err: unknown): number | null {
  const m = String((err as Error)?.message || err).match(/retry in ([\d.]+)s/i)
  return m ? Math.ceil(Number(m[1]) * 1000) : null
}

export function markCooldown(model: string, err: unknown) {
  const ms = retryDelayMs(err) ?? 60_000
  cooldown.set(model, Date.now() + Math.min(ms, 120_000))
}

function available(models: string[]) {
  const now = Date.now()
  return models.filter((m) => (cooldown.get(m) ?? 0) <= now)
}

/** First model in the chain that is not cooling down. */
export function pickModel(models: string[] = CHAT_MODELS): {name: string; model: LanguageModel} {
  const name = available(models)[0] ?? [...models].sort((a, b) => (cooldown.get(a) ?? 0) - (cooldown.get(b) ?? 0))[0]
  return {name, model: google(name)}
}

/**
 * Run `fn` with the first available model; on a rate-limit or overload error, cool that model down and try the next.
 * When every model is cooling down, wait for the earliest one (bounded) and continue, up to `rounds` passes.
 */
export async function withModelFallback<T>(
  models: string[],
  fn: (model: LanguageModel, name: string) => Promise<T>,
  opts: {label?: string; rounds?: number} = {},
): Promise<T> {
  const label = opts.label ?? 'ai'
  const rounds = opts.rounds ?? 3
  let lastErr: unknown
  for (let round = 0; round < rounds; round++) {
    for (const name of models) {
      if ((cooldown.get(name) ?? 0) > Date.now()) continue
      try {
        return await fn(google(name), name)
      } catch (err) {
        lastErr = err
        if (!isRetryableAiError(err)) throw err
        markCooldown(name, err)
        console.warn(`[${label}] ${name} unavailable, trying next model: ${String((err as Error)?.message).replace(/\s+/g, ' ').slice(0, 100)}`)
      }
    }
    const next = Math.min(...models.map((m) => cooldown.get(m) ?? 0))
    const wait = Math.max(1000, Math.min(next - Date.now(), 65_000))
    if (round < rounds - 1) {
      console.warn(`[${label}] all models busy, waiting ${Math.round(wait / 1000)}s`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastErr
}

type AnyModel = ReturnType<typeof google>

/**
 * One model object that tries each Gemini model in order. Rate-limit and overload errors are thrown when the
 * request opens, before any tokens stream, so falling through to the next model is invisible to the customer.
 */
export function fallbackModel(models: string[] = CHAT_MODELS): AnyModel {
  const first = google(models[0])
  const run = async <T>(call: (m: AnyModel) => PromiseLike<T>): Promise<T> => {
    let lastErr: unknown
    const order = [...available(models), ...models.filter((m) => !available(models).includes(m))]
    for (const name of order) {
      try {
        return await call(google(name))
      } catch (err) {
        lastErr = err
        if (!isRetryableAiError(err)) throw err
        markCooldown(name, err)
        console.warn(`[chat] ${name} unavailable, trying next model`)
      }
    }
    throw lastErr
  }
  return {
    specificationVersion: first.specificationVersion,
    provider: first.provider,
    modelId: models.join('|'),
    supportedUrls: first.supportedUrls,
    doGenerate: (options: Parameters<AnyModel['doGenerate']>[0]) => run((m) => m.doGenerate(options)),
    doStream: (options: Parameters<AnyModel['doStream']>[0]) => run((m) => m.doStream(options)),
  } as unknown as AnyModel
}
