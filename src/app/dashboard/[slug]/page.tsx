import Link from 'next/link'
import {notFound} from 'next/navigation'
import {sanityWrite, type BusinessDoc} from '@/lib/sanity'
import {Badge, ButtonLink, Card, CardHeader, EmptyState, KIND_LABEL, KindTag, Stat, StatusPill, cx, hostOf, timeAgo} from '../../ui'
import {createArticle, refreshKnowledgeBase, reingest, updateBusiness} from '../actions'
import {StatusPoller} from './StatusPoller'
import {CopyButton} from './CopyButton'
import {SubmitButton} from './SubmitButton'

export const dynamic = 'force-dynamic'

const TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'knowledge', label: 'Knowledge'},
  {id: 'tickets', label: 'Tickets'},
  {id: 'install', label: 'Install'},
  {id: 'settings', label: 'Settings'},
] as const
type TabId = (typeof TABS)[number]['id']

const KINDS = ['faq', 'policy', 'howto', 'troubleshooting', 'product', 'about', 'contact']

interface ArticleRow {
  _id: string
  title: string
  kind: string
  question?: string
  summary?: string
  needsReview?: boolean
  enabled?: boolean
  sourceUrls?: string[]
  _updatedAt: string
}
interface TicketRow {
  _id: string
  subject: string
  status: string
  priority: string
  category?: string
  reason?: string
  customerName?: string
  createdAt?: string
  emailSent?: boolean
}

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{slug: string}>
  searchParams: Promise<{tab?: string; kind?: string; q?: string; review?: string; status?: string}>
}) {
  const {slug} = await params
  const sp = await searchParams
  const tab: TabId = (TABS.find((t) => t.id === sp.tab)?.id ?? 'overview') as TabId

  const business = await sanityWrite.fetch<BusinessDoc | null>(`*[_type == "business" && slug.current == $slug][0]`, {slug})
  if (!business) notFound()

  const [articles, tickets, pageCount] = await Promise.all([
    sanityWrite.fetch<ArticleRow[]>(
      `*[_type == "knowledgeArticle" && business._ref == $id] | order(needsReview desc, kind asc, title asc){_id, title, kind, question, summary, needsReview, enabled, sourceUrls, _updatedAt}`,
      {id: business._id},
    ),
    sanityWrite.fetch<TicketRow[]>(
      `*[_type == "ticket" && business._ref == $id] | order(createdAt desc)[0...100]{_id, subject, status, priority, category, reason, customerName, createdAt, emailSent}`,
      {id: business._id},
    ),
    sanityWrite.fetch<number>(`count(*[_type == "sourcePage" && business._ref == $id])`, {id: business._id}),
  ])

  const busy = ['pending', 'crawling', 'extracting', 'building'].includes(business.status)
  const review = articles.filter((a) => a.needsReview).length
  const openTickets = tickets.filter((t) => t.status === 'open')
  const base = `/dashboard/${slug}`
  const counts: Partial<Record<TabId, number>> = {knowledge: articles.length, tickets: openTickets.length}

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      {busy && <StatusPoller id={business._id} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-lg font-semibold text-accent">
            {business.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[30px] leading-none">{business.name}</h1>
              <StatusPill status={business.status} />
            </div>
            <a href={business.websiteUrl} target="_blank" rel="noopener" className="text-sm text-muted hover:text-ink">
              {hostOf(business.websiteUrl)} ↗
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/demo.html?key=${business.publicKey}`} target="_blank" variant="accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Test the agent
          </ButtonLink>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-7 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === 'overview' ? base : `${base}?tab=${t.id}`}
            className={cx(
              'press flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
              tab === t.id ? 'bg-ink text-white' : 'text-muted hover:bg-surface-2 hover:text-ink',
            )}
          >
            {t.label}
            {counts[t.id] !== undefined && (
              <span className={cx('rounded-full px-1.5 text-[11px] tabular-nums', tab === t.id ? 'bg-white/20 text-white' : t.id === 'tickets' && counts[t.id]! > 0 ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted ring-1 ring-line')}>
                {counts[t.id]}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div key={tab} className="fade-in mt-6 min-w-0">
        {tab === 'overview' && (
          <Overview business={business} busy={busy} articles={articles} review={review} openTickets={openTickets} pageCount={pageCount} base={base} />
        )}
        {tab === 'knowledge' && <Knowledge business={business} slug={slug} articles={articles} sp={sp} base={base} busy={busy} />}
        {tab === 'tickets' && <Tickets tickets={tickets} base={base} filter={sp.status} />}
        {tab === 'install' && <Install business={business} />}
        {tab === 'settings' && <Settings business={business} slug={slug} busy={busy} />}
      </div>
    </main>
  )
}

/* ---------- Overview ---------- */

const STEPS = [
  {id: 'crawling', label: 'Read website', detail: 'Crawl pages, render JavaScript sites in Chrome'},
  {id: 'extracting', label: 'Write answers', detail: 'Gemini turns pages into small, sourced articles'},
  {id: 'building', label: 'Build knowledge base', detail: 'Sanity Context indexes the articles'},
  {id: 'ready', label: 'Live', detail: 'The widget answers customers'},
]

function Overview({business, busy, articles, review, openTickets, pageCount, base}: {
  business: BusinessDoc
  busy: boolean
  articles: ArticleRow[]
  review: number
  openTickets: TicketRow[]
  pageCount: number
  base: string
}) {
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === business.status))
  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      {(busy || business.status === 'error') && (
        <Card className={cx('p-5', business.status === 'error' && 'border-bad/30 bg-bad-soft/40')}>
          {business.status === 'error' ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-bad">Setup stopped</div>
                <div className="mt-0.5 text-sm text-ink-2">{business.statusMessage}</div>
              </div>
              <form action={reingest}>
                <input type="hidden" name="businessId" value={business._id} />
                <input type="hidden" name="slug" value={business.slug.current} />
                <SubmitButton variant="primary" pendingLabel="Starting…">Try again</SubmitButton>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="font-medium">Setting up your agent</div>
                <div className="text-sm text-muted">{business.statusMessage}</div>
              </div>
              <ol className="grid gap-3 sm:grid-cols-4">
                {STEPS.map((s, i) => {
                  const state = business.status === 'pending' ? 'todo' : i < stepIndex ? 'done' : i === stepIndex ? 'now' : 'todo'
                  return (
                    <li key={s.id} className="flex gap-3">
                      <span
                        className={cx(
                          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                          state === 'done' && 'bg-ok text-white',
                          state === 'now' && 'bg-accent text-white',
                          state === 'todo' && 'bg-surface-2 text-faint ring-1 ring-line',
                        )}
                      >
                        {state === 'done' ? '✓' : i + 1}
                      </span>
                      <div>
                        <div className={cx('text-sm font-medium', state === 'todo' ? 'text-muted' : 'text-ink')}>
                          {s.label}
                          {state === 'now' && <span className="pulse-dot ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />}
                        </div>
                        <div className="text-xs text-muted">{s.detail}</div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
        <Stat delay={0} label="Answers in knowledge base" value={articles.filter((a) => a.enabled !== false).length} hint={`from ${pageCount} pages`} />
        <Stat delay={70} label="Need your review" value={review} tone={review ? 'warn' : undefined} hint={review ? 'Pages disagreed' : 'Nothing flagged'} />
        <Stat delay={140} label="Open tickets" value={openTickets.length} tone={openTickets.length ? 'warn' : undefined} hint="Escalated to your team" />
        <Stat
          delay={210}
          label="Retrieval"
          value={<span className="text-[17px]">{business.knowledgeBaseId ? 'Knowledge Base' : 'Dataset search'}</span>}
          hint={business.knowledgeBaseId ? <code className="font-mono">{business.knowledgeBaseId}</code> : 'Sanity GROQ, per-business filter'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent escalations"
            description="Questions REZ handed to your team instead of guessing."
            action={<ButtonLink href={`${base}?tab=tickets`} variant="ghost" size="sm">All tickets →</ButtonLink>}
          />
          {openTickets.length === 0 ? (
            <EmptyState title="No open tickets">REZ is handling every question so far.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {openTickets.slice(0, 5).map((t) => (
                <TicketItem key={t._id} t={t} base={base} />
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Keep answers accurate" description="Edits reach the agent after you push them." />
          <div className="grid gap-3 p-5">
            {review > 0 && (
              <Link href={`${base}?tab=knowledge&review=1`} className="flex items-center justify-between rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn ring-1 ring-warn/20">
                <span>{review} {review === 1 ? 'answer needs' : 'answers need'} a decision</span>
                <span>Review →</span>
              </Link>
            )}
            <form action={refreshKnowledgeBase} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div>
                <div className="text-sm font-medium">Push edits to the agent</div>
                <div className="text-xs text-muted">{business.lastIngestedAt ? `Last synced ${timeAgo(business.lastIngestedAt)}` : 'Not synced yet'}</div>
              </div>
              <input type="hidden" name="businessId" value={business._id} />
              <input type="hidden" name="slug" value={business.slug.current} />
              <SubmitButton size="sm" disabled={busy} pendingLabel="Pushing…" doneLabel="Sent">Push</SubmitButton>
            </form>
            <form action={reingest} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div>
                <div className="text-sm font-medium">Re-read the website</div>
                <div className="text-xs text-muted">New pages become new answers. Your edits are kept.</div>
              </div>
              <input type="hidden" name="businessId" value={business._id} />
              <input type="hidden" name="slug" value={business.slug.current} />
              <SubmitButton size="sm" disabled={busy} pendingLabel="Starting…">Re-read</SubmitButton>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}

function TicketItem({t, base}: {t: TicketRow; base: string}) {
  return (
    <li>
      <Link href={`${base}/tickets/${t._id}`} className="group flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx('h-2 w-2 shrink-0 rounded-full', t.status === 'open' ? 'bg-warn' : 'bg-ok')} />
            <span className="truncate text-sm font-medium">{t.subject}</span>
          </div>
          <div className="mt-0.5 pl-4 text-xs text-muted">
            {t.customerName || 'Unknown customer'} · {t.category || 'general'} · {timeAgo(t.createdAt)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {t.priority === 'high' && <Badge tone="bad">High</Badge>}
          {t.emailSent ? <Badge tone="ok">Emailed</Badge> : <Badge tone="warn">Not emailed</Badge>}
        </div>
      </Link>
    </li>
  )
}

/* ---------- Knowledge ---------- */

function Knowledge({business, slug, articles, sp, base, busy}: {
  business: BusinessDoc
  slug: string
  articles: ArticleRow[]
  sp: {kind?: string; q?: string; review?: string}
  base: string
  busy: boolean
}) {
  const q = (sp.q || '').toLowerCase().trim()
  const filtered = articles.filter((a) => {
    if (sp.kind && a.kind !== sp.kind) return false
    if (sp.review === '1' && !a.needsReview) return false
    if (q && !`${a.title} ${a.question} ${a.summary}`.toLowerCase().includes(q)) return false
    return true
  })
  const kindsPresent = KINDS.filter((k) => articles.some((a) => a.kind === k))
  const link = (params: Record<string, string | undefined>) => {
    const u = new URLSearchParams({tab: 'knowledge'})
    const merged = {kind: sp.kind, q: sp.q, review: sp.review, ...params}
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v)
    return `${base}?${u.toString()}`
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] [&>*]:min-w-0">
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <form className="flex-1" action={base}>
            <input type="hidden" name="tab" value="knowledge" />
            {sp.kind && <input type="hidden" name="kind" value={sp.kind} />}
            {sp.review && <input type="hidden" name="review" value={sp.review} />}
            <input name="q" defaultValue={sp.q} placeholder="Search answers…" className="field" />
          </form>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
          <Chip href={link({kind: undefined, review: undefined})} active={!sp.kind && sp.review !== '1'}>All {articles.length}</Chip>
          <Chip href={link({review: sp.review === '1' ? undefined : '1', kind: undefined})} active={sp.review === '1'} tone="warn">
            Needs review {articles.filter((a) => a.needsReview).length}
          </Chip>
          {kindsPresent.map((k) => (
            <Chip key={k} href={link({kind: sp.kind === k ? undefined : k, review: undefined})} active={sp.kind === k}>
              {KIND_LABEL[k] ?? k} {articles.filter((a) => a.kind === k).length}
            </Chip>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyState title={busy ? 'Reading the website…' : 'No answers match'}>
            {busy ? 'Answers appear here as REZ writes them.' : 'Try a different filter or add one by hand.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((a) => (
              <li key={a._id}>
                <Link href={`${base}/articles/${a._id}`} className="group block px-4 py-3.5 transition-all duration-200 hover:bg-surface-2 hover:pl-5">
                  <div className="flex items-center gap-2">
                    <KindTag kind={a.kind} />
                    <span className={cx('truncate text-sm font-medium', a.enabled === false && 'text-faint line-through')}>{a.title}</span>
                    {a.needsReview && <Badge tone="warn">Review</Badge>}
                    {a.enabled === false && <Badge>Hidden</Badge>}
                  </div>
                  {a.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.summary}</p>}
                  {a.sourceUrls?.[0] && <div className="mt-1.5 truncate font-mono text-[11px] text-faint">{hostOf(a.sourceUrls[0])}</div>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid content-start gap-4">
        <Card>
          <CardHeader title="Add an answer" description="For things your website doesn’t say." />
          <form action={createArticle} className="grid gap-3 p-5">
            <input type="hidden" name="businessId" value={business._id} />
            <input type="hidden" name="slug" value={slug} />
            <label className="label">Title<input name="title" required className="field" placeholder="Holiday shipping cut-off" /></label>
            <label className="label">Type
              <select name="kind" className="field">{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
            </label>
            <label className="label">Customer question<input name="question" className="field" placeholder="When do I need to order by?" /></label>
            <label className="label">Short answer<input name="summary" className="field" /></label>
            <label className="label">Full answer<textarea name="body" rows={4} className="field" placeholder="Markdown is fine" /></label>
            <SubmitButton variant="primary" pendingLabel="Adding…" doneLabel="Added">Add answer</SubmitButton>
          </form>
        </Card>
        <p className="px-1 text-xs text-muted">
          After editing, use <strong>Push edits to the agent</strong> on the Overview tab. Sanity Context rebuilds the affected entries.
        </p>
      </div>
    </div>
  )
}

function Chip({href, active, tone, children}: {href: string; active?: boolean; tone?: 'warn'; children: React.ReactNode}) {
  return (
    <Link
      href={href}
      className={cx(
        'press whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
        active ? (tone === 'warn' ? 'bg-warn text-white ring-warn' : 'bg-ink text-white ring-ink') : 'bg-surface text-ink-2 ring-line hover:ring-line-strong',
      )}
    >
      {children}
    </Link>
  )
}

/* ---------- Tickets ---------- */

function Tickets({tickets, base, filter}: {tickets: TicketRow[]; base: string; filter?: string}) {
  const shown = filter === 'resolved' ? tickets.filter((t) => t.status === 'resolved') : filter === 'all' ? tickets : tickets.filter((t) => t.status === 'open')
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-3">
        <Chip href={`${base}?tab=tickets`} active={!filter || filter === 'open'}>Open {tickets.filter((t) => t.status === 'open').length}</Chip>
        <Chip href={`${base}?tab=tickets&status=resolved`} active={filter === 'resolved'}>Resolved {tickets.filter((t) => t.status === 'resolved').length}</Chip>
        <Chip href={`${base}?tab=tickets&status=all`} active={filter === 'all'}>All {tickets.length}</Chip>
      </div>
      {shown.length === 0 ? (
        <EmptyState title="Nothing here">When REZ can’t resolve something, the ticket lands here and in your inbox.</EmptyState>
      ) : (
        <ul className="divide-y divide-line">{shown.map((t) => <TicketItem key={t._id} t={t} base={base} />)}</ul>
      )}
    </Card>
  )
}

/* ---------- Install ---------- */

function Install({business}: {business: BusinessDoc}) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const snippet = `<script src="${appUrl}/widget.js" data-rez-key="${business.publicKey}" async></script>`
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] [&>*]:min-w-0">
      <Card>
        <CardHeader title="Add REZ to your website" description="Paste this once, just before </body>. That is the whole integration." action={<CopyButton text={snippet} />} />
        <div className="p-5">
          <pre className="overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-white">{snippet}</pre>
          <ol className="mt-5 grid gap-3 text-sm text-ink-2">
            <li><strong className="text-ink">1.</strong> Paste the snippet into your site’s layout or footer template.</li>
            <li><strong className="text-ink">2.</strong> Deploy. A chat bubble appears in the bottom-right corner.</li>
            <li><strong className="text-ink">3.</strong> Optional: set <code className="font-mono text-xs">data-rez-color</code> to your brand color, or call <code className="font-mono text-xs">Rez.open()</code> from a “Contact support” button.</li>
          </ol>
        </div>
      </Card>
      <Card className="p-5">
        <div className="text-sm font-medium">Widget key</div>
        <code className="mt-1 block break-all font-mono text-xs text-muted">{business.publicKey}</code>
        <div className="mt-4 text-sm font-medium">Allowed domains</div>
        <div className="mt-1 flex flex-wrap gap-1.5">{(business.allowedDomains || []).map((d) => <Badge key={d}>{d}</Badge>)}</div>
        <a href={`/demo.html?key=${business.publicKey}`} target="_blank" className="mt-5 inline-block text-sm text-accent underline">Preview on a demo page ↗</a>
      </Card>
    </div>
  )
}

/* ---------- Settings ---------- */

function Settings({business, slug, busy}: {business: BusinessDoc; slug: string; busy: boolean}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
      <Card>
        <CardHeader title="Agent" description="How REZ talks and where escalations go." />
        <form action={updateBusiness} className="grid gap-4 p-5">
          <input type="hidden" name="businessId" value={business._id} />
          <input type="hidden" name="slug" value={slug} />
          <label className="label">Escalation email<span className="hint">Tickets REZ can’t resolve are emailed here.</span><input name="escalationEmail" type="email" defaultValue={business.escalationEmail} className="field" /></label>
          <label className="label">About the business<textarea name="description" rows={3} defaultValue={business.description} className="field" /></label>
          <label className="label">Tone<input name="tone" defaultValue={business.tone} className="field" placeholder="Warm, concise, a little playful" /></label>
          <label className="label">Opening hours<input name="hours" defaultValue={business.hours} className="field" /></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="label">Bot name<input name="botName" defaultValue={business.widget?.botName} className="field" /></label>
            <label className="label sm:col-span-2">Accent color
              <div className="flex gap-2">
                <input name="accentColor" defaultValue={business.widget?.accentColor || '#4338ca'} className="field font-mono" />
                <span className="h-[38px] w-[38px] shrink-0 rounded-[10px] ring-1 ring-line" style={{background: business.widget?.accentColor || '#4338ca'}} />
              </div>
            </label>
          </div>
          <label className="label">Greeting<input name="greeting" defaultValue={business.widget?.greeting} className="field" /></label>
          <div><SubmitButton variant="primary" pendingLabel="Saving…" doneLabel="Saved">Save changes</SubmitButton></div>
        </form>
      </Card>
      <div className="grid content-start gap-6">
        <Card>
          <CardHeader title="Data" />
          <dl className="grid gap-3 p-5 text-sm">
            <Row k="Website" v={<a href={business.websiteUrl} className="text-accent underline" target="_blank" rel="noopener">{hostOf(business.websiteUrl)}</a>} />
            <Row k="Sanity document" v={<code className="font-mono text-xs">{business._id}</code>} />
            <Row k="Knowledge Base" v={business.knowledgeBaseId ? <code className="font-mono text-xs">{business.knowledgeBaseId}</code> : <span className="text-muted">Shared dataset search</span>} />
            <Row k="Last synced" v={business.lastIngestedAt ? timeAgo(business.lastIngestedAt) : '—'} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Re-read website" description="Crawl again for new pages. Answers you edited are never overwritten." />
          <form action={reingest} className="p-5">
            <input type="hidden" name="businessId" value={business._id} />
            <input type="hidden" name="slug" value={slug} />
            <SubmitButton disabled={busy} pendingLabel="Starting…">Re-read {hostOf(business.websiteUrl)}</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  )
}

function Row({k, v}: {k: string; v: React.ReactNode}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  )
}
