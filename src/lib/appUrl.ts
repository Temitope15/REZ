import {headers} from 'next/headers'

/**
 * The public address of this REZ deployment, used in install snippets and email links.
 * Prefers NEXT_PUBLIC_APP_URL, but ignores a leftover localhost value when the request
 * clearly came from a real domain, so a missed env var can't break the snippet.
 */
export async function getAppUrl(): Promise<string> {
  const env = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || ''
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const fromRequest = host ? `${proto}://${host}` : ''
  const envIsLocal = /localhost|127\.0\.0\.1/.test(env)
  const requestIsLocal = /localhost|127\.0\.0\.1/.test(host)
  if (env && !(envIsLocal && !requestIsLocal)) return env
  return fromRequest || env
}
