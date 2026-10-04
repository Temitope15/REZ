import Link from 'next/link'
import type {ComponentProps, ReactNode} from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Logo({className}: {className?: string}) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-semibold tracking-tight text-ink', className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[13px] font-bold text-white">R</span>
      <span className="font-display text-[18px]">REZ</span>
    </span>
  )
}

export function Card({className, children}: {className?: string; children: ReactNode}) {
  return <div className={cx('rounded-2xl border border-line bg-surface shadow-[0_1px_0_rgba(23,22,27,0.03)]', className)}>{children}</div>
}

export function CardHeader({title, description, action}: {title: ReactNode; description?: ReactNode; action?: ReactNode}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad'
const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2 ring-line',
  accent: 'bg-accent-soft text-accent ring-accent/15',
  ok: 'bg-ok-soft text-ok ring-ok/15',
  warn: 'bg-warn-soft text-warn ring-warn/20',
  bad: 'bg-bad-soft text-bad ring-bad/15',
}

export function Badge({tone = 'neutral', children, className}: {tone?: Tone; children: ReactNode; className?: string}) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset', TONES[tone], className)}>
      {children}
    </span>
  )
}

const STATUS: Record<string, {tone: Tone; label: string; live?: boolean}> = {
  pending: {tone: 'warn', label: 'Queued', live: true},
  crawling: {tone: 'warn', label: 'Reading website', live: true},
  extracting: {tone: 'warn', label: 'Writing answers', live: true},
  building: {tone: 'accent', label: 'Building knowledge base', live: true},
  ready: {tone: 'ok', label: 'Live'},
  error: {tone: 'bad', label: 'Needs attention'},
}

export function StatusPill({status}: {status: string}) {
  const s = STATUS[status] ?? {tone: 'neutral' as Tone, label: status}
  return (
    <Badge tone={s.tone}>
      <span className={cx('h-1.5 w-1.5 rounded-full bg-current', s.live && 'pulse-dot')} />
      {s.label}
    </Badge>
  )
}

const BUTTON = {
  primary: 'bg-ink text-white hover:bg-ink-2 border border-ink',
  accent: 'bg-accent text-accent-ink hover:brightness-110 border border-accent',
  secondary: 'bg-surface text-ink hover:bg-surface-2 border border-line-strong',
  ghost: 'text-ink-2 hover:bg-surface-2 border border-transparent',
  danger: 'text-bad hover:bg-bad-soft border border-transparent',
}
export type ButtonVariant = keyof typeof BUTTON

export function buttonClass(variant: ButtonVariant = 'secondary', size: 'sm' | 'md' = 'md') {
  return cx(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm',
    BUTTON[variant],
  )
}

export function Button({variant = 'secondary', size = 'md', className, ...props}: ComponentProps<'button'> & {variant?: ButtonVariant; size?: 'sm' | 'md'}) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />
}

export function ButtonLink({variant = 'secondary', size = 'md', className, ...props}: ComponentProps<typeof Link> & {variant?: ButtonVariant; size?: 'sm' | 'md'}) {
  return <Link className={cx(buttonClass(variant, size), className)} {...props} />
}

export function Stat({label, value, hint, tone}: {label: string; value: ReactNode; hint?: ReactNode; tone?: Tone}) {
  return (
    <Card className="px-5 py-4">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className={cx('font-display mt-2 text-[32px] leading-none tabular-nums', tone === 'warn' ? 'text-warn' : tone === 'bad' ? 'text-bad' : 'text-ink')}>
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </Card>
  )
}

export function EmptyState({title, children}: {title: string; children?: ReactNode}) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-faint ring-1 ring-line">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </div>
      <div className="text-sm font-medium text-ink">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  )
}

export const KIND_LABEL: Record<string, string> = {
  faq: 'FAQ',
  policy: 'Policy',
  howto: 'How-to',
  troubleshooting: 'Fix',
  product: 'Product',
  about: 'About',
  contact: 'Contact',
}
export function KindTag({kind}: {kind: string}) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted ring-1 ring-inset ring-line">
      {KIND_LABEL[kind] ?? kind}
    </span>
  )
}

export function timeAgo(iso?: string) {
  if (!iso) return ''
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

export function hostOf(url?: string) {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}
