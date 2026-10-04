/**
 * REZ ingest worker. Runs the long, heavy part of onboarding that serverless hosts cannot:
 * crawling with headless Chrome, Gemini extraction, Sanity writes, and the Sanity Context Knowledge Base build.
 *
 * Endpoints (all but /health need `Authorization: Bearer $REZ_WORKER_SECRET`):
 *   GET  /health                    -> {ok, queue, running, browser}
 *   POST /jobs  {type, businessId}  -> 202; type is "ingest" | "refresh-kb"
 *
 * Jobs run one at a time so the free 512 MB instance never runs two Chrome-heavy crawls at once.
 * Progress is written to the business document in Sanity, which the dashboard already polls.
 */
import http from 'node:http'
import {ingestBusiness} from '../src/lib/ingest'
import {buildKnowledgeBase, ensureKnowledgeBase} from '../src/lib/kb'
import {sanityWrite, setBusinessStatus, type BusinessDoc} from '../src/lib/sanity'
import {browserAvailable, closeBrowser} from '../src/lib/render'

const PORT = Number(process.env.PORT || 10000)
const SECRET = process.env.REZ_WORKER_SECRET
if (!SECRET) {
  console.error('REZ_WORKER_SECRET must be set')
  process.exit(1)
}

type Job = {type: 'ingest' | 'refresh-kb'; businessId: string; maxPages?: number; queuedAt: string}
const queue: Job[] = []
let running: Job | null = null

async function runJob(job: Job) {
  if (job.type === 'ingest') {
    await ingestBusiness(job.businessId, {maxPages: job.maxPages})
    return
  }
  const business = await sanityWrite.fetch<BusinessDoc | null>(`*[_type == "business" && _id == $id][0]`, {id: job.businessId})
  if (!business) throw new Error(`Business ${job.businessId} not found`)
  await setBusinessStatus(business._id, 'building', 'Refreshing the knowledge base')
  try {
    const hadKb = Boolean(business.knowledgeBaseId)
    const kbId = await ensureKnowledgeBase(business)
    await buildKnowledgeBase(kbId, hadKb ? 'refresh' : 'build')
    await sanityWrite
      .patch(business._id)
      .set({status: 'ready', statusMessage: 'Knowledge base refreshed', lastIngestedAt: new Date().toISOString()})
      .commit()
  } catch (err) {
    await setBusinessStatus(business._id, 'error', String((err as Error)?.message || err).slice(0, 300))
    throw err
  }
}

async function drain() {
  if (running) return
  while (queue.length) {
    running = queue.shift()!
    const started = Date.now()
    console.log(`[worker] start ${running.type} ${running.businessId}`)
    try {
      await runJob(running)
      console.log(`[worker] done ${running.type} ${running.businessId} in ${Math.round((Date.now() - started) / 1000)}s`)
    } catch (err) {
      console.error(`[worker] failed ${running.type} ${running.businessId}:`, String((err as Error)?.message || err).slice(0, 300))
    } finally {
      running = null
    }
  }
  // Free Chrome's memory between jobs.
  await closeBrowser()
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {'content-type': 'application/json'})
  res.end(JSON.stringify(body))
}

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    return {}
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
    return send(res, 200, {ok: true, running: running && {type: running.type, businessId: running.businessId}, queue: queue.length})
  }
  if (req.headers.authorization !== `Bearer ${SECRET}`) return send(res, 401, {error: 'unauthorized'})

  if (req.method === 'GET' && url.pathname === '/health/browser') {
    return send(res, 200, {browser: await browserAvailable()})
  }

  if (req.method === 'POST' && url.pathname === '/jobs') {
    const body = await readJson(req)
    const type = body.type === 'refresh-kb' ? 'refresh-kb' : 'ingest'
    const businessId = typeof body.businessId === 'string' ? body.businessId : ''
    if (!businessId) return send(res, 400, {error: 'businessId is required'})
    if (queue.some((j) => j.businessId === businessId && j.type === type) || (running?.businessId === businessId && running.type === type)) {
      return send(res, 202, {queued: false, reason: 'already queued'})
    }
    const maxPages = typeof body.maxPages === 'number' ? Math.min(body.maxPages, 60) : undefined
    queue.push({type, businessId, maxPages, queuedAt: new Date().toISOString()})
    send(res, 202, {queued: true, position: queue.length + (running ? 1 : 0)})
    void drain()
    return
  }
  send(res, 404, {error: 'not found'})
})

/**
 * If the worker restarted mid-job (deploy, crash, or the free instance running out of memory),
 * businesses are left half-set-up. On boot, pick them up again, at most twice each.
 */
async function resumeInterruptedJobs() {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const stuck = await sanityWrite.fetch<{_id: string; status: string; ingestAttempts?: number}[]>(
    `*[_type == "business" && status in ["pending", "crawling", "extracting", "building"] && _updatedAt < $cutoff]{_id, status, ingestAttempts}`,
    {cutoff},
  )
  for (const b of stuck) {
    const attempts = b.ingestAttempts ?? 0
    if (attempts >= 2) {
      await setBusinessStatus(b._id, 'error', 'Setup was interrupted twice. Click Try again, or try a smaller site.')
      continue
    }
    await sanityWrite.patch(b._id).set({ingestAttempts: attempts + 1}).commit()
    await setBusinessStatus(b._id, 'pending', 'Resuming setup after a restart')
    queue.push({type: b.status === 'building' ? 'refresh-kb' : 'ingest', businessId: b._id, queuedAt: new Date().toISOString()})
    console.log(`[worker] resuming ${b._id} (attempt ${attempts + 1})`)
  }
  if (queue.length) void drain()
}

server.listen(PORT, () => {
  console.log(`[worker] listening on :${PORT}`)
  resumeInterruptedJobs().catch((err) => console.error('[worker] resume failed', err))
})
