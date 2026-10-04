import {dispatchJob} from '@/lib/jobs'
import {sanityRead} from '@/lib/sanity'

export const maxDuration = 300

/** Re-run the crawl, extraction and Knowledge Base refresh for one business. */
export async function POST(_req: Request, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params
  const {via} = await dispatchJob('ingest', id)
  return Response.json({ok: true, id, via})
}

export async function GET(_req: Request, ctx: {params: Promise<{id: string}>}) {
  const {id} = await ctx.params
  const row = await sanityRead.fetch(`*[_type == "business" && _id == $id][0]{_id, name, status, statusMessage, lastIngestedAt, knowledgeBaseId, "articles": count(*[_type == "knowledgeArticle" && business._ref == ^._id]), "pages": count(*[_type == "sourcePage" && business._ref == ^._id])}`, {id})
  if (!row) return Response.json({error: 'Not found'}, {status: 404})
  return Response.json(row)
}
