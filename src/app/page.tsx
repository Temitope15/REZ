import Link from 'next/link'
import {OnboardForm} from './OnboardForm'
import {Logo, ButtonLink} from './ui'

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ButtonLink href="/dashboard" variant="ghost" size="sm">Dashboard →</ButtonLink>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-2 ring-1 ring-line">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Built on Sanity Context
          </div>
          <h1 className="mt-5 text-[40px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
            Your support team, <span className="text-accent">minus the repetitive tickets.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
            Give REZ your website. It reads every page, builds a structured knowledge base in Sanity, and answers your customers with sources.
            When it can’t help, it emails your team a ready-to-answer ticket instead of guessing.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['Reads your site', 'Including JavaScript apps. Every answer keeps a link to the page it came from.'],
              ['You stay in control', 'Edit any answer. Pages that disagree are flagged for you to decide.'],
              ['Escalates honestly', 'No answer, no guess. Your inbox gets the transcript and a draft reply.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-line bg-surface p-4">
                <div className="text-sm font-semibold">{t}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-muted">{d}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-surface p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-faint">The whole integration</div>
            <pre className="mt-2 overflow-x-auto font-mono text-[12.5px] text-ink-2">{`<script src="…/widget.js" data-rez-key="rez_…" async></script>`}</pre>
          </div>
        </section>

        <section id="start" className="lg:pt-6">
          <OnboardForm />
          <p className="mt-4 text-center text-sm text-muted">
            Already set up? <Link href="/dashboard" className="text-accent underline">Open the dashboard</Link>
          </p>
        </section>
      </main>
    </div>
  )
}
