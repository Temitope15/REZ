import Link from 'next/link'
import {sanityWrite} from '@/lib/sanity'
import {Card, EmptyState, ButtonLink, StatusPill, hostOf, timeAgo} from '../ui'

export const dynamic = 'force-dynamic'

interface Row {
  _id: string
  name: string
  slug: {current: string}
  websiteUrl: string
  status: string
  statusMessage?: string
  lastIngestedAt?: string
  knowledgeBaseId?: string
  articles: number
  review: number
  openTickets: number
}

export default async function DashboardHome() {
  const rows = await sanityWrite.fetch<Row[]>(
    `*[_type == "business"] | order(_createdAt desc){_id, name, slug, websiteUrl, status, statusMessage, lastIngestedAt, knowledgeBaseId,
      "articles": count(*[_type == "knowledgeArticle" && business._ref == ^._id]),
      "review": count(*[_type == "knowledgeArticle" && business._ref == ^._id && needsReview == true]),
      "openTickets": count(*[_type == "ticket" && business._ref == ^._id && status == "open"])}`,
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[36px] leading-none">Businesses</h1>
          <p className="mt-1 text-sm text-muted">Every business REZ answers for. Open one to review its answers and tickets.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState title="No businesses yet">
            Give REZ a website and it builds the support agent for you. <Link href="/#start" className="text-accent underline">Add the first one</Link>.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Link key={r._id} href={`/dashboard/${r.slug.current}`} className="group">
              <Card className="h-full p-5 transition group-hover:border-line-strong group-hover:shadow-[0_6px_24px_-12px_rgba(23,22,27,0.18)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-[15px] font-semibold text-accent">
                    {r.name.slice(0, 1).toUpperCase()}
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="mt-4 font-semibold text-ink">{r.name}</div>
                <div className="truncate text-sm text-muted">{hostOf(r.websiteUrl)}</div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                  <Mini label="Answers" value={r.articles} />
                  <Mini label="To review" value={r.review} warn={r.review > 0} />
                  <Mini label="Open tickets" value={r.openTickets} warn={r.openTickets > 0} />
                </div>
                <div className="mt-4 text-xs text-faint">
                  {r.knowledgeBaseId ? 'Sanity Context Knowledge Base' : 'Shared dataset search'}
                  {r.lastIngestedAt ? ` · updated ${timeAgo(r.lastIngestedAt)}` : ''}
                </div>
              </Card>
            </Link>
          ))}
          <Link href="/#start" className="group">
            <div className="grid h-full min-h-[220px] place-items-center rounded-2xl border border-dashed border-line-strong p-5 text-center text-sm text-muted transition group-hover:border-accent group-hover:text-accent">
              <div>
                <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border border-current">+</div>
                Add a business
              </div>
            </div>
          </Link>
        </div>
      )}
      <div className="mt-10 flex justify-end">
        <ButtonLink href="/studio" variant="ghost" size="sm">Open the raw data in Sanity Studio →</ButtonLink>
      </div>
    </main>
  )
}

function Mini({label, value, warn}: {label: string; value: number; warn?: boolean}) {
  return (
    <div>
      <div className={`text-lg font-semibold tabular-nums ${warn ? 'text-warn' : 'text-ink'}`}>{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}
