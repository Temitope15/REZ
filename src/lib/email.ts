import nodemailer, {type Transporter} from 'nodemailer'

let transport: Transporter | null = null

function getTransport() {
  if (transport) return transport
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASS must be set')
  transport = nodemailer.createTransport({host, port, secure: port === 465, auth: {user, pass}})
  return transport
}

export interface EscalationEmail {
  to: string
  businessName: string
  subject: string
  summary: string
  reason: string
  customerName?: string
  customerEmail?: string
  transcript: string
  suggestedReply?: string
  ticketUrl?: string
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c] as string)
}

export async function sendEscalationEmail(e: EscalationEmail) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!
  const text = [
    `REZ could not resolve a customer request for ${e.businessName}.`,
    '',
    `Subject: ${e.subject}`,
    `Reason: ${e.reason}`,
    `Customer: ${e.customerName || 'Unknown'}${e.customerEmail ? ` <${e.customerEmail}>` : ''}`,
    '',
    'Summary:',
    e.summary,
    '',
    e.suggestedReply ? `Suggested reply:\n${e.suggestedReply}\n` : '',
    'Transcript:',
    e.transcript,
    '',
    e.ticketUrl ? `Ticket: ${e.ticketUrl}` : '',
  ].join('\n')

  const html = `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 8px">New escalation from REZ</h2>
    <p style="margin:0 0 16px;color:#555">REZ could not resolve this request for <strong>${escapeHtml(e.businessName)}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
      <tr><td style="padding:6px 0;color:#555;width:120px">Subject</td><td style="padding:6px 0">${escapeHtml(e.subject)}</td></tr>
      <tr><td style="padding:6px 0;color:#555">Reason</td><td style="padding:6px 0">${escapeHtml(e.reason)}</td></tr>
      <tr><td style="padding:6px 0;color:#555">Customer</td><td style="padding:6px 0">${escapeHtml(e.customerName || 'Unknown')}${e.customerEmail ? ` &lt;<a href="mailto:${escapeHtml(e.customerEmail)}">${escapeHtml(e.customerEmail)}</a>&gt;` : ''}</td></tr>
    </table>
    <h3 style="margin:16px 0 4px">Summary</h3>
    <p style="margin:0 0 16px">${escapeHtml(e.summary)}</p>
    ${e.suggestedReply ? `<h3 style="margin:16px 0 4px">Suggested reply</h3><p style="margin:0 0 16px;white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:6px">${escapeHtml(e.suggestedReply)}</p>` : ''}
    <h3 style="margin:16px 0 4px">Transcript</h3>
    <pre style="white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:6px;font-size:13px">${escapeHtml(e.transcript)}</pre>
    ${e.ticketUrl ? `<p><a href="${escapeHtml(e.ticketUrl)}">Open ticket in REZ</a></p>` : ''}
  </div>`

  await getTransport().sendMail({
    from: `REZ <${from}>`,
    to: e.to,
    replyTo: e.customerEmail || undefined,
    subject: `[REZ] ${e.subject}`,
    text,
    html,
  })
}
