import Link from 'next/link'
import {OnboardForm} from './OnboardForm'
import {Logo} from './ui'
import {Reveal} from './landing/Reveal'
import {HeroDemo} from './landing/HeroDemo'
import {ArtInstall, ArtLearn, ArtLink, SanityFlow} from './landing/Art'

const QUESTIONS = [
  'Where’s my order?',
  'Can I return this?',
  'Do you ship abroad?',
  'What are your opening hours?',
  'How do I cancel my subscription?',
  'Is this in stock?',
  'Do you offer refunds?',
  'How long does delivery take?',
  'Can I change my address?',
  'Which size should I pick?',
]

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="REZ home"><Logo /></Link>
          <nav className="hidden items-center gap-7 text-[14px] text-ink-2 md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#handoff" className="hover:text-ink">When it can’t help</a>
            <a href="#sanity" className="hover:text-ink">Powered by Sanity</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden rounded-lg px-3 py-2 text-[14px] text-ink-2 hover:text-ink sm:block">Dashboard</Link>
            <a href="#start" className="group inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[14px] font-medium text-white">
              Get started <Arrow />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hatch relative border-b border-line">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 text-center sm:pt-24">
          <div className="rise inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-[12.5px] text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok pulse-dot" /> REZ · customer support, handled
          </div>
          <h1 className="font-display rise mx-auto mt-6 max-w-5xl text-balance text-[44px] leading-[0.98] sm:text-[60px] lg:text-[72px]" style={{animationDelay: '80ms'}}>
            Your customers get answers.
            <br />
            You get your day back.
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-balance text-[17px] leading-relaxed text-muted sm:text-[19px]" style={{animationDelay: '160ms'}}>
            Paste your website link. REZ learns your business and replies to customers day and night. If it can’t help, it passes the question to you.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{animationDelay: '240ms'}}>
            <a href="#start" className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_10px_30px_-12px_rgba(11,11,12,0.6)]">
              Start with your website <Arrow />
            </a>
            <a href="#how" className="rounded-xl border border-line-strong bg-surface px-6 py-3.5 text-[15px] font-medium text-ink hover:border-ink">
              See how it works
            </a>
          </div>
          <p className="rise mt-4 text-[13px] text-faint" style={{animationDelay: '300ms'}}>Free to try · Live in about five minutes · No coding</p>

          <div className="rise mt-16" style={{animationDelay: '380ms'}}>
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* Questions marquee */}
      <section className="border-b border-line bg-surface py-8">
        <p className="mb-5 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-muted">The questions REZ answers, so you don’t have to</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="marquee flex w-max gap-3">
            {[...QUESTIONS, ...QUESTIONS].map((q, i) => (
              <span key={i} className="whitespace-nowrap rounded-full border border-line-strong px-4 py-2 text-[14px] text-ink-2">{q}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-balance text-[36px] leading-[1.02] sm:text-[52px]">Three steps. Then it runs itself.</h2>
            <p className="mt-4 text-[17px] text-muted">No training, no scripts to write, no new inbox to watch.</p>
          </Reveal>
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {[
              {n: '01', t: 'Paste your link', d: 'REZ reads your website: your products, prices, policies and FAQs.', art: <ArtLink />},
              {n: '02', t: 'Check what it learned', d: 'See every answer REZ wrote. Change anything in a click.', art: <ArtLearn />},
              {n: '03', t: 'Add it to your site', d: 'Copy one line onto your website. A chat bubble appears. That’s it.', art: <ArtInstall />},
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120} className="bg-surface p-8">
                <div className="font-mono text-[12px] text-faint">{s.n}</div>
                <div className="my-6">{s.art}</div>
                <h3 className="font-display text-[22px]" style={{letterSpacing: '-0.025em'}}>{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl divide-y divide-line px-5 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            ['Always shows its source', 'Every answer points to the page it came from.'],
            ['Never makes things up', 'If it isn’t on your site, REZ says so.'],
            ['Awake at 3am', 'Customers get help in seconds, any time.'],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 100} className="px-2 py-10 md:px-8">
              <div className="font-display text-[20px]" style={{letterSpacing: '-0.02em'}}>{t}</div>
              <div className="mt-1.5 text-[15px] text-muted">{d}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Handoff */}
      <section id="handoff" className="scroll-mt-16 border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 md:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-balance text-[36px] leading-[1.02] sm:text-[48px]">It knows when to hand over.</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              Refunds, complaints, anything it isn’t sure about. REZ never guesses. It takes the customer’s details and emails you the whole conversation, with a reply ready to send.
            </p>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink">
              Your team only sees what truly needs a person.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="rotate-[-1.2deg] rounded-2xl border border-line-strong bg-surface p-6 shadow-[0_30px_60px_-30px_rgba(11,11,12,0.35)]">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">R</span>
                  REZ → you
                </span>
                <span>9:41 AM</span>
              </div>
              <div className="font-display mt-4 text-[20px]" style={{letterSpacing: '-0.02em'}}>Refund request · torn bag</div>
              <div className="mt-1 text-[13px] text-muted">Ada Obi · order #DW48213</div>
              <div className="mt-5 rounded-xl bg-surface-2 p-4 text-[14px] leading-relaxed text-ink-2 ring-1 ring-line">
                “My bag arrived torn open and coffee was everywhere. I’d like a refund to my card.”
              </div>
              <div className="mt-4 text-[12px] font-medium uppercase tracking-wide text-muted">Suggested reply</div>
              <div className="mt-1.5 text-[14px] leading-relaxed text-ink-2">Hi Ada, so sorry about that! We’ve refunded your card. It should arrive in 3–5 days.</div>
              <div className="mt-5 flex gap-2">
                <span className="rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-white">Reply</span>
                <span className="rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] text-ink-2">Mark resolved</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sanity */}
      <section id="sanity" className="scroll-mt-16 border-b border-line bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="max-w-2xl">
            <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/50">Powered by Sanity</div>
            <h2 className="font-display text-balance mt-4 text-[36px] leading-[1.02] sm:text-[52px]">Why REZ gets the answer right.</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/65">
              REZ doesn’t just skim your website. Everything it learns is organized and stored in Sanity, the content platform trusted by thousands of companies. That’s what keeps answers accurate and easy for you to fix.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-14 overflow-x-auto rounded-2xl bg-white p-6 sm:p-10">
            <div className="min-w-[620px]"><SanityFlow /></div>
          </Reveal>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Organized, not dumped', 'Each page becomes small, clear answers stored in Sanity. You can open and edit every one.'],
              ['A knowledge base made for AI', 'Sanity Context turns those answers into a knowledge base REZ checks before every reply.'],
              ['Learns where it falls short', 'Every conversation is saved to Sanity Insights, so you can see which questions need a better answer.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={150 + i * 100} className="rounded-2xl border border-white/12 p-6">
                <div className="font-display text-[20px]" style={{letterSpacing: '-0.02em'}}>{t}</div>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Get started */}
      <section id="start" className="bg-hatch scroll-mt-16">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-24 md:grid-cols-[1fr_440px]">
          <Reveal className="md:pt-6">
            <h2 className="font-display text-balance text-[40px] leading-[1] sm:text-[60px]">Ready in about five minutes.</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">Tell us your business and your website. We’ll show you everything REZ learned before any customer sees it.</p>
            <ul className="mt-8 grid gap-3 text-[15px] text-ink-2">
              {['Free while we’re in beta', 'Nothing to install on your side but one line', 'You approve every answer'].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-white">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <OnboardForm />
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-muted">
          <Logo />
          <span>Built with Sanity · © {new Date().getFullYear()} REZ</span>
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        </div>
      </footer>
    </div>
  )
}
