/**
 * Headless Chrome rendering for sites that build their content with JavaScript (React, Vue, Angular SPAs).
 * Playwright is loaded lazily, so environments without a browser (e.g. Vercel functions) simply skip rendering.
 */
import type {Browser} from 'playwright'

let browserPromise: Promise<Browser | null> | null = null

export function renderingDisabled() {
  return process.env.REZ_RENDER === 'off'
}

async function getBrowser(): Promise<Browser | null> {
  if (renderingDisabled()) return null
  if (!browserPromise) {
    browserPromise = (async () => {
      try {
        const {chromium} = await import('playwright')
        return await chromium.launch({
          headless: true,
          // Tight memory settings so Chrome fits next to Node on a 512 MB free instance.
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--disable-extensions', '--disable-background-networking', '--disable-default-apps', '--mute-audio', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=192'],
        })
      } catch (err) {
        console.warn('Headless browser unavailable, JavaScript sites will not be rendered:', String((err as Error)?.message).split('\n')[0])
        return null
      }
    })()
  }
  return browserPromise
}

export async function browserAvailable() {
  return Boolean(await getBrowser())
}

const BLOCKED = new Set(['image', 'media', 'font', 'stylesheet'])

/** Load the page in Chrome, let its JavaScript run, and return the final HTML. */
export async function renderHtml(url: string, timeoutMs = 15000): Promise<string | null> {
  const browser = await getBrowser()
  if (!browser) return null
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; RezBot/0.1; customer-support knowledge crawler)',
    viewport: {width: 1280, height: 900},
    javaScriptEnabled: true,
  })
  const page = await context.newPage()
  try {
    await page.route('**/*', (route) => (BLOCKED.has(route.request().resourceType()) ? route.abort() : route.continue()))
    // Don't wait for "network idle": apps with analytics or websockets never go idle, which cost ~25s per page.
    // Load the document, then wait only until real text has replaced the loading shell.
    const nav = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: timeoutMs}).catch(() => null)
    if (!nav) return null
    // Wait until the app has replaced its loading shell with real text, up to a few seconds.
    await page
      .waitForFunction(
        () => {
          const t = (document.body?.innerText || '').trim()
          return t.length > 300 && !/^\s*loading\.{0,3}\s*$/i.test(t)
        },
        undefined,
        {timeout: 8000},
      )
      .catch(() => null)
    // Open collapsed FAQ items (details/summary and common accordion buttons) so their answers are in the DOM.
    await page
      .evaluate(() => {
        document.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''))
        document
          .querySelectorAll<HTMLElement>('[aria-expanded="false"]')
          .forEach((el, i) => {
            if (i < 60) el.click()
          })
      })
      .catch(() => null)
    await page.waitForTimeout(500)
    return await page.content()
  } catch (err) {
    console.warn(`render failed for ${url}:`, String((err as Error)?.message).split('\n')[0])
    return null
  } finally {
    await context.close().catch(() => null)
  }
}

export async function closeBrowser() {
  if (!browserPromise) return
  const b = await browserPromise
  browserPromise = null
  await b?.close().catch(() => null)
}
