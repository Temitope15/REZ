import {createHash, randomBytes} from 'node:crypto'
import {sanityWrite, setBusinessStatus, type BusinessDoc} from './sanity'
import {crawlSite, type CrawledPage} from './crawler'
import {batchPages, describeBusiness, extractBatch, mergeArticles, mergeProfiles, type ExtractedArticle, type ExtractedProfile} from './extract'
import {ensureKnowledgeBase, buildKnowledgeBase, isKbLimitError} from './kb'

const short = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 12)

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'business'
}

export function newPublicKey() {
  return 'rez_' + randomBytes(12).toString('hex')
}

export interface IngestOptions {
  maxPages?: number
  concurrency?: number
  buildKb?: boolean
  log?: (msg: string) => void
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({length: Math.min(limit, items.length)}, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}

async function writeSourcePages(business: BusinessDoc, pages: CrawledPage[]) {
  const now = new Date().toISOString()
  for (let i = 0; i < pages.length; i += 25) {
    const tx = sanityWrite.transaction()
    for (const p of pages.slice(i, i + 25)) {
      tx.createOrReplace({
        _id: `page-${short(business._id + p.url)}`,
        _type: 'sourcePage',
        business: {_type: 'reference', _ref: business._id},
        url: p.url,
        title: p.title,
        contentHash: p.hash,
        markdown: p.markdown,
        fetchedAt: now,
        extracted: true,
      })
    }
    await tx.commit()
  }
}

async function writeArticles(business: BusinessDoc, articles: ReturnType<typeof mergeArticles>) {
  const existing = new Set<string>(
    await sanityWrite.fetch<string[]>(`*[_type == "knowledgeArticle" && business._ref == $b]._id`, {b: business._id}),
  )
  let created = 0
  for (let i = 0; i < articles.length; i += 25) {
    const tx = sanityWrite.transaction()
    for (const a of articles.slice(i, i + 25)) {
      const _id = `art-${short(business._id + a.kind + a.title.toLowerCase())}`
      // Never overwrite an article the business may have edited.
      if (existing.has(_id)) continue
      created++
      tx.create({
        _id,
        _type: 'knowledgeArticle',
        business: {_type: 'reference', _ref: business._id},
        title: a.title,
        kind: a.kind,
        question: a.question,
        summary: a.summary,
        body: a.body,
        keywords: a.keywords,
        sourceUrls: a.sourceUrls,
        sources: a.sourceUrls.map((u) => ({_type: 'reference', _ref: `page-${short(business._id + u)}`, _key: short(u)})),
        confidence: a.confidence,
        needsReview: a.needsReview,
        conflictNote: a.conflictNote,
        enabled: true,
      })
    }
    await tx.commit()
  }
  return created
}

async function applyProfile(business: BusinessDoc, profile: ExtractedProfile) {
  const patch: Record<string, unknown> = {}
  if (profile.description && !business.description) patch.description = profile.description
  if (profile.tone && !business.tone) patch.tone = profile.tone
  if (profile.hours && !business.hours) patch.hours = profile.hours
  const contact = {...(business.contact || {})}
  if (profile.email && !contact.email) contact.email = profile.email
  if (profile.phone && !contact.phone) contact.phone = profile.phone
  if (profile.address && !contact.address) contact.address = profile.address
  patch.contact = contact
  await sanityWrite.patch(business._id).set(patch).commit()
}

/**
 * Full pipeline: crawl the site, extract articles with Gemini, write everything to Sanity,
 * then create and build the Sanity Context Knowledge Base. Status is kept on the business doc.
 */
export async function ingestBusiness(businessId: string, opts: IngestOptions = {}) {
  const log = opts.log || ((m: string) => console.log(`[ingest ${businessId}] ${m}`))
  const business = await sanityWrite.fetch<BusinessDoc | null>(`*[_type == "business" && _id == $id][0]`, {id: businessId})
  if (!business) throw new Error(`Business ${businessId} not found`)

  try {
    await setBusinessStatus(business._id, 'crawling', 'Reading your website')
    let lastProgress = 0
    const pages = await crawlSite(business.websiteUrl, {
      maxPages: opts.maxPages ?? 40,
      concurrency: Number(process.env.REZ_CRAWL_CONCURRENCY) || 4,
      renderConcurrency: Number(process.env.REZ_RENDER_CONCURRENCY) || 2,
      onProgress: (done, queued, url) => {
        log(`crawled ${done}, queued ${queued}: ${url}`)
        // Show live progress in the dashboard, at most every 4 seconds.
        const now = Date.now()
        if (now - lastProgress > 4000) {
          lastProgress = now
          const rendered = url.endsWith('(rendered)') ? ' (this site needs a browser, so it takes a little longer)' : ''
          setBusinessStatus(business._id, 'crawling', `Read ${done + 1} ${done === 0 ? 'page' : 'pages'} so far${rendered}`).catch(() => null)
        }
      },
    })
    if (!pages.length) throw new Error('No readable pages found. Is the site reachable without JavaScript?')
    log(`crawl done: ${pages.length} pages`)
    await writeSourcePages(business, pages)

    await setBusinessStatus(business._id, 'extracting', `Turning ${pages.length} pages into answers`)
    const batches = batchPages(pages)
    let failedBatches = 0
    const results = await mapLimit(batches, opts.concurrency ?? 2, async (batch, i) => {
      try {
        const r = await extractBatch(business.name, business.websiteUrl, batch)
        log(`extracted batch ${i + 1}/${batches.length} with ${r.model}: ${r.articles.length} articles from ${batch.length} pages`)
        return r
      } catch (err) {
        failedBatches++
        log(`batch ${i + 1}/${batches.length} skipped: ${String((err as Error)?.message).replace(/\s+/g, ' ').slice(0, 160)}`)
        return {articles: [] as ExtractedArticle[], profile: undefined}
      }
    })
    if (failedBatches === batches.length) throw new Error('Gemini could not process any page. The free-tier quota may be exhausted; try again in a minute.')
    const all: ExtractedArticle[] = results.flatMap((r) => r.articles)
    const merged = mergeArticles(all)
    const profile = mergeProfiles(results.map((r) => r.profile))
    const created = await writeArticles(business, merged)
    // Fill "About the business" even when no page states it outright. Owner edits are never overwritten.
    if (!profile.description && !business.description) {
      const d = await describeBusiness(business.name, pages)
      if (d) {
        profile.description = d.description
        if (!profile.tone && d.tone) profile.tone = d.tone
      }
    }
    await applyProfile(business, profile)
    log(`wrote ${created} new articles (${merged.length} after merge, ${all.length} raw)`)

    if (opts.buildKb !== false) {
      await setBusinessStatus(business._id, 'building', 'Building the knowledge base in Sanity Context')
      try {
        const kbId = await ensureKnowledgeBase({...business})
        await buildKnowledgeBase(kbId, business.knowledgeBaseId ? 'refresh' : 'build')
        log(`knowledge base ${kbId} ready`)
      } catch (err) {
        if (!isKbLimitError(err)) throw err
        // The Sanity plan caps Knowledge Bases per organization. The business still goes live:
        // the agent answers from the same structured articles through a tenant-filtered GROQ search.
        log('knowledge base limit reached, serving answers from the shared dataset')
        await sanityWrite
          .patch(business._id)
          .set({status: 'ready', statusMessage: `${merged.length} answers ready (shared dataset search; Knowledge Base limit reached)`, lastIngestedAt: new Date().toISOString(), ingestAttempts: 0})
          .commit()
        return {pages: pages.length, articles: merged.length, created}
      }
    }

    await sanityWrite
      .patch(business._id)
      .set({status: 'ready', statusMessage: `${merged.length} answers from ${pages.length} pages`, lastIngestedAt: new Date().toISOString(), ingestAttempts: 0})
      .commit()
    return {pages: pages.length, articles: merged.length, created}
  } catch (err) {
    const msg = (err as Error)?.message || String(err)
    log(`failed: ${msg}`)
    await setBusinessStatus(business._id, 'error', msg.slice(0, 300))
    throw err
  }
}
