import * as cheerio from 'cheerio'
import TurndownService from 'turndown'
import {createHash} from 'node:crypto'
import {renderHtml} from './render'

export interface CrawledPage {
  url: string
  title: string
  markdown: string
  hash: string
  /** True when the page was rendered in headless Chrome because its HTML was an empty JavaScript shell. */
  rendered?: boolean
}

export interface CrawlOptions {
  maxPages?: number
  concurrency?: number
  timeoutMs?: number
  onProgress?: (done: number, queued: number, url: string) => void
  /** auto: render only pages that look like a JavaScript shell. always: render every page. never: plain HTML only. */
  render?: 'auto' | 'always' | 'never'
  /** Max pages rendered in Chrome at the same time. Keep low on small servers. */
  renderConcurrency?: number
  /** Stop starting new pages after this long and keep what was read. Default 5 minutes. */
  timeBudgetMs?: number
  /** Page cap once the site turns out to need Chrome (each page is slow to render). Default 20. */
  maxRenderedPages?: number
}

const USER_AGENT = 'RezBot/0.1 (customer-support knowledge crawler)'

/** Paths that are never useful for a support knowledge base. */
const SKIP_PATTERNS = [
  /\/(wp-admin|wp-login|wp-json|cart|checkout|login|logout|signin|signup|register|account|admin|search|feed|rss)(\/|$)/i,
  /\/(tag|tags|category|categories|author|page)\/[^/]+/i,
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|json|xml|pdf|zip|mp4|mp3|woff2?|ttf)(\?|$)/i,
  /\?(replytocom|share|utm_)/i,
]

/** URLs that look like support content get crawled first. */
const PRIORITY_WORDS = [
  'faq', 'help', 'support', 'shipping', 'delivery', 'return', 'refund', 'policy', 'policies', 'terms',
  'privacy', 'contact', 'about', 'pricing', 'price', 'plans', 'how', 'guide', 'docs', 'product', 'services',
  'warranty', 'cancel', 'payment', 'order', 'track',
]

function priorityOf(url: string): number {
  const lower = url.toLowerCase()
  let score = 0
  for (const w of PRIORITY_WORDS) if (lower.includes(w)) score += 1
  const depth = new URL(url).pathname.split('/').filter(Boolean).length
  return score * 10 - depth
}

export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const u = new URL(raw, base)
    if (!/^https?:$/.test(u.protocol)) return null
    if (!u.hash.startsWith('#/')) u.hash = ''
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref)/i.test(key)) u.searchParams.delete(key)
    }
    let s = u.toString()
    if (s.endsWith('/') && u.pathname !== '/') s = s.slice(0, -1)
    return s
  } catch {
    return null
  }
}

function sameSite(a: URL, b: URL): boolean {
  const strip = (h: string) => h.replace(/^www\./, '')
  return strip(a.hostname) === strip(b.hostname)
}

async function fetchText(url: string, timeoutMs: number): Promise<{text: string; contentType: string} | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: {'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},
      redirect: 'follow',
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    const text = await res.text()
    return {text, contentType}
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

async function readRobots(origin: string, timeoutMs: number): Promise<{disallow: RegExp[]; sitemaps: string[]}> {
  const out = {disallow: [] as RegExp[], sitemaps: [] as string[]}
  const r = await fetchText(`${origin}/robots.txt`, timeoutMs)
  if (!r) return out
  let applies = false
  for (const rawLine of r.text.split('\n')) {
    const line = rawLine.split('#')[0].trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const v = line.slice(idx + 1).trim()
    if (key === 'user-agent') applies = v === '*' || /rezbot/i.test(v)
    else if (key === 'sitemap') out.sitemaps.push(v)
    else if (key === 'disallow' && applies && v) {
      const pattern = v.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
      out.disallow.push(new RegExp('^' + pattern))
    }
  }
  return out
}

async function readSitemap(url: string, timeoutMs: number, depth = 0): Promise<string[]> {
  if (depth > 2) return []
  const r = await fetchText(url, timeoutMs)
  if (!r) return []
  const $ = cheerio.load(r.text, {xml: true})
  const nested = $('sitemapindex > sitemap > loc').map((_, el) => $(el).text().trim()).get()
  if (nested.length) {
    const all: string[] = []
    for (const n of nested.slice(0, 10)) all.push(...(await readSitemap(n, timeoutMs, depth + 1)))
    return all
  }
  return $('urlset > url > loc').map((_, el) => $(el).text().trim()).get()
}

const turndown = new TurndownService({headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-'})
const REMOVE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'FORM', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'])
turndown.remove((node) => REMOVE_TAGS.has(node.nodeName.toUpperCase()))

const NOISE_SELECTOR = [
  'nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript', 'iframe', 'svg', 'form',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '.cookie', '#cookie', '.cookies', '.newsletter', '.breadcrumb', '.breadcrumbs',
].join(', ')

export function htmlToPage(url: string, html: string): {page: CrawledPage; links: string[]} {
  const $ = cheerio.load(html)
  const title = ($('meta[property="og:title"]').attr('content') || $('title').first().text() || url).trim()
  const links = $('a[href]')
    .map((_, el) => normalizeUrl($(el).attr('href') || '', url))
    .get()
    .filter((l): l is string => Boolean(l))
  const metaDesc = ($('meta[name="description"]').attr('content') || '').trim()

  $(NOISE_SELECTOR).remove()
  const candidates = ['main', 'article', '[role="main"]']
  let root: ReturnType<typeof $> = $('body')
  for (const sel of candidates) {
    const el = $(sel).first()
    if (el.length && (el.text() || '').trim().length > 200) {
      root = el
      break
    }
  }
  let markdown = turndown.turndown(root.html() || '')
  markdown = markdown.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim()
  if (metaDesc && !markdown.includes(metaDesc)) markdown = `> ${metaDesc}\n\n${markdown}`
  const hash = createHash('sha256').update(markdown).digest('hex').slice(0, 32)
  return {page: {url, title, markdown, hash}, links}
}

/** Heuristic: the server sent an app shell (empty root div, "Loading...", or "enable JavaScript") instead of content. */
export function looksLikeShell(html: string, markdown: string): boolean {
  const text = markdown.replace(/[#>*_\-[\]()`]/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length < 400) return true
  if (text.length < 1500 && /\b(loading\.{0,3}|please enable javascript|you need to enable javascript|requires javascript)/i.test(text)) return true
  const mountPoint = /<div[^>]+id=["'](root|app|__next|___gatsby|svelte)["'][^>]*>\s*<\/div>/i.test(html)
  return mountPoint && text.length < 1500
}

/**
 * Crawl a website starting from `startUrl`, same site only, respecting robots.txt.
 * Support-looking pages are visited first. Pages with little text are skipped.
 */
export async function crawlSite(startUrl: string, opts: CrawlOptions = {}): Promise<CrawledPage[]> {
  let maxPages = opts.maxPages ?? 40
  const deadline = Date.now() + (opts.timeBudgetMs ?? (Number(process.env.REZ_CRAWL_BUDGET_MS) || 5 * 60 * 1000))
  const maxRenderedPages = opts.maxRenderedPages ?? 20
  const concurrency = opts.concurrency ?? 4
  const timeoutMs = opts.timeoutMs ?? 15000

  const start = normalizeUrl(startUrl)
  if (!start) throw new Error(`Invalid start URL: ${startUrl}`)
  const startUrlObj = new URL(start)
  const robots = await readRobots(startUrlObj.origin, timeoutMs)

  const allowed = (url: string) => {
    const u = new URL(url)
    if (!sameSite(u, startUrlObj)) return false
    if (SKIP_PATTERNS.some((p) => p.test(url))) return false
    if (robots.disallow.some((p) => p.test(u.pathname))) return false
    return true
  }

  const seen = new Set<string>([start])
  const queue: string[] = [start]
  const sitemapUrls = [...robots.sitemaps, `${startUrlObj.origin}/sitemap.xml`]
  for (const sm of sitemapUrls) {
    for (const raw of await readSitemap(sm, timeoutMs)) {
      const n = normalizeUrl(raw)
      if (n && !seen.has(n) && allowed(n)) {
        seen.add(n)
        queue.push(n)
      }
    }
    if (queue.length > maxPages * 3) break
  }

  const pages: CrawledPage[] = []
  const seenHashes = new Set<string>()
  let active = 0
  let fetched = 0
  const maxFetches = maxPages * 3
  const renderMode = opts.render ?? 'auto'
  // Once one page turns out to need JavaScript, the whole site almost certainly does.
  let siteNeedsJs = renderMode === 'always'

  // Limit concurrent Chrome pages; each one costs real memory.
  const renderLimit = opts.renderConcurrency ?? 2
  let rendering = 0
  const waiters: (() => void)[] = []
  const withRenderSlot = async <T,>(fn: () => Promise<T>): Promise<T> => {
    if (rendering >= renderLimit) await new Promise<void>((r) => waiters.push(r))
    rendering++
    try {
      return await fn()
    } finally {
      rendering--
      waiters.shift()?.()
    }
  }

  const loadPage = async (url: string): Promise<{page: CrawledPage; links: string[]} | null> => {
    if (!siteNeedsJs) {
      const r = await fetchText(url, timeoutMs)
      if (r && /text\/html/i.test(r.contentType)) {
        const plain = htmlToPage(url, r.text)
        if (renderMode === 'never' || !looksLikeShell(r.text, plain.page.markdown)) return plain
        const html = await withRenderSlot(() => renderHtml(url))
        if (!html) return plain
        const rendered = htmlToPage(url, html)
        if (rendered.page.markdown.length > plain.page.markdown.length + 100) {
          siteNeedsJs = true
          maxPages = Math.min(maxPages, maxRenderedPages)
          return {page: {...rendered.page, rendered: true}, links: [...new Set([...rendered.links, ...plain.links])]}
        }
        return plain
      }
      if (renderMode === 'never') return null
    }
    const html = await withRenderSlot(() => renderHtml(url))
    if (!html) return null
    const rendered = htmlToPage(url, html)
    return {page: {...rendered.page, rendered: true}, links: rendered.links}
  }

  const sortQueue = () => queue.sort((a, b) => priorityOf(b) - priorityOf(a))

  await new Promise<void>((resolve) => {
    const pump = () => {
      const outOfTime = Date.now() > deadline
      if (pages.length >= maxPages || fetched >= maxFetches || outOfTime || (queue.length === 0 && active === 0)) {
        if (active === 0) resolve()
        return
      }
      while (active < concurrency && queue.length && pages.length + active < maxPages && fetched < maxFetches && Date.now() <= deadline) {
        sortQueue()
        const url = queue.shift()!
        active++
        fetched++
        loadPage(url)
          .then((r) => {
            if (!r) return
            const {page, links} = r
            opts.onProgress?.(pages.length, queue.length, page.rendered ? `${url} (rendered)` : url)
            for (const l of links) {
              if (!seen.has(l) && allowed(l)) {
                seen.add(l)
                queue.push(l)
              }
            }
            if (page.markdown.length < 200) return
            if (seenHashes.has(page.hash)) return
            seenHashes.add(page.hash)
            if (pages.length < maxPages) pages.push(page)
          })
          .catch(() => null)
          .finally(() => {
            active--
            pump()
          })
      }
    }
    pump()
  })

  return pages
}
