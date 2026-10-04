import Link from 'next/link'
import {Logo, ButtonLink} from '../ui'

export default function DashboardLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" aria-label="REZ dashboard">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link href="/dashboard" className="rounded-lg px-2.5 py-1.5 text-ink-2 hover:bg-surface">Businesses</Link>
              <Link href="/studio" className="rounded-lg px-2.5 py-1.5 text-ink-2 hover:bg-surface">Sanity Studio</Link>
            </nav>
          </div>
          <ButtonLink href="/#start" variant="primary" size="sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add business
          </ButtonLink>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-line py-6 text-center text-xs text-faint">
        REZ · powered by Sanity
      </footer>
    </div>
  )
}
