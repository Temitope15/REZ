import {after} from 'next/server'
import {ingestBusiness} from './ingest'
import {buildKnowledgeBase, ensureKnowledgeBase} from './kb'
import {sanityWrite, setBusinessStatus, type BusinessDoc} from './sanity'

export type JobType = 'ingest' | 'refresh-kb'

/**
 * Run a heavy job. In production it goes to the REZ worker on Render (REZ_WORKER_URL), which has headless Chrome
 * and no time limit. Without a worker it runs in this process after the response is sent, which is fine locally.
 * Either way, progress lands on the business document in Sanity.
 */
export async function dispatchJob(type: JobType, businessId: string): Promise<{via: 'worker' | 'local'}> {
  const workerUrl = process.env.REZ_WORKER_URL
  if (workerUrl) {
    await setBusinessStatus(businessId, type === 'ingest' ? 'pending' : 'building', 'Queued, waking the REZ worker (can take up to a minute)')
    // A sleeping free Render instance takes ~30-60s to wake on the first request, so allow a long timeout.
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 110_000)
    try {
      const res = await fetch(new URL('/jobs', workerUrl), {
        method: 'POST',
        headers: {'content-type': 'application/json', authorization: `Bearer ${process.env.REZ_WORKER_SECRET}`},
        body: JSON.stringify({type, businessId}),
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`worker responded ${res.status}`)
      return {via: 'worker'}
    } catch (err) {
      await setBusinessStatus(businessId, 'error', `Could not reach the REZ worker: ${String((err as Error)?.message || err).slice(0, 200)}`)
      throw err
    } finally {
      clearTimeout(t)
    }
  }

  after(async () => {
    try {
      if (type === 'ingest') await ingestBusiness(businessId)
      else await refreshKnowledgeBaseNow(businessId)
    } catch (err) {
      console.error(`${type} failed`, err)
    }
  })
  return {via: 'local'}
}

export async function refreshKnowledgeBaseNow(businessId: string) {
  const business = await sanityWrite.fetch<BusinessDoc | null>(`*[_type == "business" && _id == $id][0]`, {id: businessId})
  if (!business) throw new Error('Business not found')
  await setBusinessStatus(businessId, 'building', 'Refreshing the knowledge base')
  try {
    const hadKb = Boolean(business.knowledgeBaseId)
    const kbId = await ensureKnowledgeBase(business)
    await buildKnowledgeBase(kbId, hadKb ? 'refresh' : 'build')
    await sanityWrite.patch(businessId).set({status: 'ready', statusMessage: 'Knowledge base refreshed', lastIngestedAt: new Date().toISOString()}).commit()
  } catch (err) {
    await setBusinessStatus(businessId, 'error', String((err as Error)?.message || err).slice(0, 300))
    throw err
  }
}
