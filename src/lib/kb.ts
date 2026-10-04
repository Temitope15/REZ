import {createClient, type SanityClient} from '@sanity/client'
import {sanityWrite, type BusinessDoc} from './sanity'

/**
 * Sanity Context Knowledge Bases through the HTTP API in @sanity/client (`client.context`).
 * This is the same API the `sanity context` CLI uses, so it works in serverless functions too.
 * Auth is an organization token (SANITY_ORGANIZATION_TOKEN).
 */
const CONTEXT_API_VERSION = '2026-08-25'

function orgToken() {
  const t = process.env.SANITY_ORGANIZATION_TOKEN
  if (!t) throw new Error('SANITY_ORGANIZATION_TOKEN is not set')
  return t
}

/** Client for collection-level calls (create, list, get). */
function contextClient(): SanityClient {
  return createClient({apiVersion: CONTEXT_API_VERSION, token: orgToken(), useCdn: false, useProjectHostname: false})
}

/** Client scoped to one Knowledge Base (imports, build, refresh, jobs). */
function kbClient(knowledgeBaseId: string): SanityClient {
  return createClient({
    apiVersion: CONTEXT_API_VERSION,
    token: orgToken(),
    useCdn: false,
    useProjectHostname: false,
    resource: {type: 'knowledge-base', id: knowledgeBaseId},
  })
}

export function articlesQuery(businessId: string) {
  return `*[_type == "knowledgeArticle" && business._ref == "${businessId}" && enabled != false]{title, kind, question, summary, body, keywords, sourceUrls}`
}

/** Create (if needed) a Knowledge Base for the business and bind our dataset as its source. */
export async function ensureKnowledgeBase(business: BusinessDoc): Promise<string> {
  const organizationId = process.env.SANITY_ORGANIZATION_ID
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || 'production'
  if (!organizationId || !projectId) throw new Error('SANITY_ORGANIZATION_ID and SANITY_PROJECT_ID must be set')

  if (business.knowledgeBaseId) return business.knowledgeBaseId

  const kb = await contextClient().context.knowledgeBases.create({
    organizationId,
    title: `${business.name} support`,
    description: `Customer support knowledge for ${business.name} (${business.websiteUrl}). Built by REZ from structured articles in the Sanity dataset.`,
  })
  const kbId = kb.publicId
  await sanityWrite.patch(business._id).set({knowledgeBaseId: kbId}).commit()

  // A dataset source must match at least one published document, so articles are written before this runs.
  await kbClient(kbId).context.imports.create({
    type: 'dataset',
    query: articlesQuery(business._id),
    sanityProjectId: projectId,
    sanityDatasetId: dataset,
  })
  return kbId
}

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled'])

export async function waitForJob(knowledgeBaseId: string, jobId: string, timeoutMs = 10 * 60 * 1000) {
  const client = kbClient(knowledgeBaseId)
  const start = Date.now()
  for (;;) {
    const job = await client.context.jobs.get({jobId})
    if (TERMINAL.has(job.status)) {
      if (job.status !== 'succeeded') throw new Error(`Knowledge Base job ${job.status}${job.error ? `: ${job.error}` : ''}`)
      return job
    }
    if (Date.now() - start > timeoutMs) throw new Error('Timed out waiting for the Knowledge Base build')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

/** Build (first time) or refresh (later) the Knowledge Base so the agent sees the latest articles. Waits until done. */
export async function buildKnowledgeBase(knowledgeBaseId: string, mode: 'build' | 'refresh' = 'build'): Promise<string> {
  const client = kbClient(knowledgeBaseId)
  if (mode === 'refresh') {
    const {jobId, started} = await client.context.refresh()
    if (!started) return 'Knowledge Base already up to date'
    await waitForJob(knowledgeBaseId, jobId)
    return `refreshed (${jobId})`
  }
  const {jobId} = await client.context.build()
  await waitForJob(knowledgeBaseId, jobId)
  return `built (${jobId})`
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content?: string | null
  toolName?: string | null
  toolType?: 'call' | 'result' | null
  error?: string | null
}

/**
 * Record the conversation in Sanity Context Insights so the business sees scores, sentiment and content gaps.
 * Needs an organization token with Context Editor access; failures are logged and never break the chat.
 */
export async function saveConversation(params: {
  threadId: string
  messages: ConversationMessage[]
  businessSlug: string
  knowledgeBaseId?: string
  modelId?: string
  tokenUsage?: {inputTokens?: number; outputTokens?: number; totalTokens?: number}
}) {
  const organizationId = process.env.SANITY_ORGANIZATION_ID
  if (!organizationId || process.env.REZ_DISABLE_INSIGHTS === '1') return
  try {
    const client = createClient({apiVersion: CONTEXT_API_VERSION, token: orgToken(), useCdn: false, useProjectHostname: false, context: {organizationId}} as never)
    await client.context.conversations.save({
      threadId: params.threadId.slice(0, 200),
      messages: params.messages,
      modelProvider: 'google',
      modelId: params.modelId,
      tokenUsage: params.tokenUsage,
      metadata: {
        app: 'rez',
        mcpEndpoints: ['rez'],
        business: params.businessSlug,
        ...(params.knowledgeBaseId ? {knowledgeBase: params.knowledgeBaseId} : {}),
      },
    })
  } catch (err) {
    console.warn('Insights save skipped:', String((err as Error)?.message || err).slice(0, 200))
  }
}

/** True when Sanity refused to create a Knowledge Base because the organization's plan limit is reached. */
export function isKbLimitError(err: unknown): boolean {
  return /plan limit for knowledge bases|limit for knowledge bases is reached/i.test(String((err as Error)?.message || err))
}
