import Link from 'next/link'
import {notFound} from 'next/navigation'
import {sanityWrite} from '@/lib/sanity'
import {resolveTicket} from '../../../actions'
import {Badge, Card, CardHeader, timeAgo} from '../../../../ui'
import {SubmitButton} from '../../SubmitButton'
import {CopyButton} from '../../CopyButton'

export const dynamic = 'force-dynamic'

interface Ticket {
  _id: string
  subject: string
  status: string
  priority: string
  category?: string
  reason?: string
  summary?: string
  customerName?: string
  customerEmailMasked?: string
  transcript?: string
  suggestedReply?: string
  emailSent?: boolean
  createdAt?: string
}

const REASONS: Record<string, string> = {
  no_answer: 'The knowledge base had no answer',
  customer_requested: 'Customer asked for a person',
  needs_action: 'Needs an action REZ can’t take',
  complaint: 'Complaint',
  other: 'Other',
}

export default async function TicketPage({params}: {params: Promise<{slug: string; id: string}>}) {
  const {slug, id} = await params
  const t = await sanityWrite.fetch<Ticket | null>(`*[_type == "ticket" && _id == $id][0]`, {id})
  if (!t) notFound()

  const lines = (t.transcript || '').split(/\n\n+/).filter(Boolean)

  return (
    <main className="fade-in mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <Link href={`/dashboard/${slug}?tab=tickets`} className="text-sm text-muted hover:text-ink">← Tickets</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight">{t.subject}</h1>
            {t.status === 'open' ? <Badge tone="warn">Open</Badge> : <Badge tone="ok">Resolved</Badge>}
            {t.priority === 'high' && <Badge tone="bad">High priority</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">{t.category || 'general'} · opened {timeAgo(t.createdAt)}</p>
        </div>
        {t.status === 'open' && (
          <form action={resolveTicket}>
            <input type="hidden" name="id" value={t._id} />
            <input type="hidden" name="slug" value={slug} />
            <SubmitButton variant="primary" pendingLabel="Resolving…" doneLabel="Resolved">Mark resolved</SubmitButton>
          </form>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title="Summary" />
            <p className="p-5 text-sm leading-relaxed text-ink-2">{t.summary}</p>
          </Card>
          {t.suggestedReply && (
            <Card>
              <CardHeader title="Suggested reply" description="Drafted by REZ from the conversation." action={<CopyButton text={t.suggestedReply} />} />
              <p className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-ink-2">{t.suggestedReply}</p>
            </Card>
          )}
          <Card>
            <CardHeader title="Conversation" />
            <div className="grid gap-3 p-5">
              {lines.map((l, i) => {
                const isCustomer = l.startsWith('Customer:')
                const text = l.replace(/^(Customer|Rez):\s*/, '')
                return (
                  <div key={i} className={isCustomer ? 'mr-10' : 'ml-10'}>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-faint">{isCustomer ? t.customerName || 'Customer' : 'REZ'}</div>
                    <div className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${isCustomer ? 'bg-surface-2 ring-1 ring-line' : 'bg-accent-soft text-ink'}`}>{text}</div>
                  </div>
                )
              })}
              {lines.length === 0 && <p className="text-sm text-muted">No transcript saved.</p>}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <dl className="grid gap-4 p-5 text-sm">
            <div><dt className="text-xs text-muted">Customer</dt><dd className="mt-0.5 font-medium">{t.customerName || 'Unknown'}</dd><dd className="text-muted">{t.customerEmailMasked}</dd></div>
            <div><dt className="text-xs text-muted">Why REZ escalated</dt><dd className="mt-0.5">{REASONS[t.reason || ''] ?? t.reason}</dd></div>
            <div>
              <dt className="text-xs text-muted">Email to your team</dt>
              <dd className="mt-0.5">{t.emailSent ? 'Sent, with the full customer email and transcript. Reply to it to answer the customer.' : 'Not sent. Check the SMTP settings.'}</dd>
            </div>
            <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted ring-1 ring-line">The customer’s email is masked here because this dataset is public. The full address is only in the email.</p>
          </dl>
        </Card>
      </div>
    </main>
  )
}
