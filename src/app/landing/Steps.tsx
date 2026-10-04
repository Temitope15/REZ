import {Reveal} from './Reveal'

/* Each step's illustration is small working UI, animated in a loop once the card scrolls into view. */

function StepLink() {
  return (
    <div className="flex h-28 items-center justify-center">
      <div className="flex w-[220px] items-center gap-2 rounded-full border-[1.5px] border-ink bg-surface py-1.5 pl-4 pr-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        <span className="anim-type inline-block w-0 overflow-hidden whitespace-nowrap border-r-2 border-ink pr-0.5 font-mono text-[13px] text-ink" style={{width: '12.6ch'}}>
          yourshop.com
        </span>
        <span className="flex-1" />
        <span className="anim-go grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </div>
  )
}

function StepLearn() {
  const rows = ['Returns within 30 days', 'Free shipping over $40', 'Open 9am to 5pm']
  return (
    <div className="flex h-28 items-center justify-center gap-4">
      <div className="relative h-[86px] w-[60px] overflow-hidden rounded-md border-[1.5px] border-ink bg-surface p-2">
        <div className="space-y-1.5">
          {[100, 70, 85, 55, 90, 65].map((wd, i) => (
            <div key={i} className="h-[3px] rounded bg-ink/70" style={{width: `${wd}%`}} />
          ))}
        </div>
        <div className="anim-scan absolute inset-x-0 top-2 h-4 bg-gradient-to-b from-transparent via-ink/15 to-transparent" />
      </div>
      <svg width="18" height="12" viewBox="0 0 18 12" className="text-ink"><path d="M1 6h14M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div className="grid gap-1.5">
        {rows.map((r, i) => (
          <div key={r} className="anim-row flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[11.5px] text-ink-2" style={{animationDelay: `${i * 0.35}s`}}>
            <span className="anim-check grid h-3.5 w-3.5 place-items-center rounded-full bg-ink text-white" style={{animationDelay: `${i * 0.35}s`}}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
            </span>
            {r}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepInstall() {
  return (
    <div className="flex h-28 items-center justify-center">
      <div className="relative h-[100px] w-[190px] overflow-hidden rounded-lg border-[1.5px] border-ink bg-surface">
        <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
          <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
          <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
        </div>
        <div className="space-y-1.5 p-2.5">
          <div className="h-[5px] w-16 rounded bg-ink/70" />
          <div className="h-[3px] w-24 rounded bg-ink/15" />
          <div className="h-[3px] w-20 rounded bg-ink/15" />
        </div>
        <div className="anim-panel absolute bottom-9 right-2 w-[96px] rounded-lg border border-line-strong bg-surface p-1.5 shadow-md">
          <div className="anim-msg ml-auto h-2.5 w-14 rounded-full bg-ink" style={{animationDelay: '0s'}} />
          <div className="anim-msg mt-1 h-2.5 w-[72px] rounded-full bg-surface-2 ring-1 ring-line" style={{animationDelay: '0.5s'}} />
        </div>
        <span className="anim-bubble absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-white">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H8l-4 4z" /></svg>
        </span>
      </div>
    </div>
  )
}

const STEPS = [
  {n: '01', t: 'Paste your link', d: 'REZ reads your website: your products, prices, policies and FAQs.', art: <StepLink />},
  {n: '02', t: 'Check what it learned', d: 'See every answer REZ wrote. Change anything in a click.', art: <StepLearn />},
  {n: '03', t: 'Add it to your site', d: 'Copy one line onto your website. A chat bubble appears. That’s it.', art: <StepInstall />},
]

export function Steps() {
  return (
    <Reveal className="relative mt-16">
      {/* Progress rail that fills as the section arrives */}
      <div className="absolute -top-6 left-[16.66%] right-[16.66%] hidden h-px bg-line-strong md:block">
        <div className="anim-fill h-px bg-ink" />
        {[0, 50, 100].map((p, i) => (
          <span
            key={p}
            className="anim-node absolute -top-[5px] h-[11px] w-[11px] -translate-x-1/2 rounded-full border border-line-strong bg-surface"
            style={{left: `${p}%`, animationDelay: `${0.3 + i * 0.75}s`}}
          />
        ))}
      </div>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 140} className="group bg-surface p-8 transition-colors duration-300 hover:bg-surface-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-faint transition-colors group-hover:text-ink">{s.n}</span>
              <span className="h-px w-8 bg-line-strong transition-all duration-500 group-hover:w-14 group-hover:bg-ink" />
            </div>
            <div className="my-6">{s.art}</div>
            <h3 className="font-display text-[22px]" style={{letterSpacing: '-0.025em'}}>{s.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
          </Reveal>
        ))}
      </div>
    </Reveal>
  )
}
