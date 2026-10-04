import {sanityWrite, type BusinessDoc} from './sanity'
import {sendEscalationEmail} from './email'
import {getAppUrl} from './appUrl'

export interface EscalationInput {
  business: BusinessDoc
  sessionId: string
  subject: string
  summary: string
  reason: string
  category?: string
  priority?: 'low' | 'normal' | 'high'
  customerName?: string
  customerEmail?: string
  transcript: string
  suggestedReply?: string
}

/** "jane.doe@example.com" becomes "j***@example.com". The dataset is public, so the full address never lands in Sanity. */
export function maskEmail(email?: string) {
  if (!email) return undefined
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local.slice(0, 1)}***@${domain}`
}

export async function escalate(input: EscalationInput): Promise<{ticketId: string; emailSent: boolean}> {
  const createdAt = new Date().toISOString()
  const ticket = await sanityWrite.create({
    _type: 'ticket',
    business: {_type: 'reference', _ref: input.business._id},
    status: 'open',
    priority: input.priority || 'normal',
    category: input.category || 'general',
    subject: input.subject,
    summary: input.summary,
    reason: input.reason,
    customerName: input.customerName,
    customerEmailMasked: maskEmail(input.customerEmail),
    transcript: input.transcript,
    suggestedReply: input.suggestedReply,
    sessionId: input.sessionId,
    emailSent: false,
    createdAt,
  })

  let emailSent = false
  try {
    const appUrl = await getAppUrl().catch(() => (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, ''))
    await sendEscalationEmail({
      to: input.business.escalationEmail,
      businessName: input.business.name,
      subject: input.subject,
      summary: input.summary,
      reason: input.reason,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      transcript: input.transcript,
      suggestedReply: input.suggestedReply,
      ticketUrl: appUrl ? `${appUrl}/dashboard/${input.business.slug.current}/tickets/${ticket._id}` : undefined,
    })
    emailSent = true
    await sanityWrite.patch(ticket._id).set({emailSent: true}).commit()
  } catch (err) {
    console.error('Escalation email failed', err)
  }

  return {ticketId: ticket._id, emailSent}
}
