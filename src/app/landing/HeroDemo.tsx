'use client'

import {useEffect, useState} from 'react'

/**
 * The hero's living example: a customer asks, REZ answers with its source,
 * then a question it shouldn't handle is handed to the owner's inbox.
 */
type Msg = {from: 'customer' | 'rez'; text: string; source?: string}

const SCRIPT: {at: number; msg?: Msg; typing?: boolean; ticket?: boolean}[] = [
  {at: 600, msg: {from: 'customer', text: 'Hi! Can I return coffee I didn’t like?'}},
  {at: 1500, typing: true},
  {at: 3000, msg: {from: 'rez', text: 'Coffee can’t be returned once opened, but everything else can within 30 days. Would an exchange help?', source: 'Returns & refunds'}},
  {at: 5600, msg: {from: 'customer', text: 'My bag arrived torn. I’d like a refund, please.'}},
  {at: 6500, typing: true},
  {at: 8000, msg: {from: 'rez', text: 'I’m sorry about that! I’ve passed this to the team with your order details. They’ll email you today.'}},
  {at: 8900, ticket: true},
]
const LOOP_MS = 15000

export function HeroDemo() {
  const [t, setT] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setT(LOOP_MS - 1)
      return
    }
    const start = Date.now()
    const id = setInterval(() => setT((Date.now() - start) % LOOP_MS), 100)
    return () => clearInterval(id)
  }, [])

  const shown = SCRIPT.filter((s) => s.at <= t)
  const msgs = shown.filter((s) => s.msg).map((s) => s.msg!)
  const last = shown[shown.length - 1]
  const typing = last?.typing === true
  const ticket = shown.some((s) => s.ticket)

  return (
    <div className="relative mx-auto w-full max-w-[860px] text-left">
      {/* Browser frame */}
      <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_40px_80px_-40px_rgba(11,11,12,0.35)]">
        <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          </div>
          <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-1.5 rounded-md bg-surface px-3 py-1 text-[11px] text-muted ring-1 ring-line">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            yourshop.com
          </div>
          <div className="w-10" />
        </div>

        <div className="grid min-h-[380px] grid-cols-1 md:grid-cols-[1fr_340px]">
          {/* The business's own site, sketched */}
          <div className="bg-dots hidden border-r border-line p-7 md:block">
            <div className="h-3 w-24 rounded bg-ink/80" />
            <div className="mt-6 h-6 w-3/4 rounded bg-ink/10" />
            <div className="mt-2 h-6 w-1/2 rounded bg-ink/10" />
            <div className="mt-5 space-y-2">
              <div className="h-2.5 w-full rounded bg-ink/[0.06]" />
              <div className="h-2.5 w-5/6 rounded bg-ink/[0.06]" />
              <div className="h-2.5 w-2/3 rounded bg-ink/[0.06]" />
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-lg border border-line bg-surface" />
              ))}
            </div>
          </div>

          {/* The REZ chat */}
          <div className="flex flex-col bg-surface">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[12px] font-bold text-white">R</span>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold">Rez</div>
                <div className="flex items-center gap-1 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Replies instantly</div>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2.5 px-4 py-4">
              {msgs.map((m, i) => (
                <div key={i} className={`rise max-w-[88%] ${m.from === 'customer' ? 'self-end' : 'self-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
                      m.from === 'customer' ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-surface-2 text-ink ring-1 ring-line'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.source && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10.5px] text-muted">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h12l4 4v12H4z" /><path d="M8 12h8M8 16h5" /></svg>
                      From your page: {m.source}
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="typing self-start rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-3 text-muted ring-1 ring-line">
                  <span /> <span /> <span />
                </div>
              )}
            </div>
            <div className="border-t border-line px-4 py-3">
              <div className="rounded-full border border-line px-3.5 py-2 text-[12px] text-faint">Ask a question…</div>
            </div>
          </div>
        </div>
      </div>

      {/* The handoff: lands in the owner's inbox */}
      <div
        className={`absolute -bottom-6 right-2 w-[270px] rounded-2xl border border-line-strong bg-surface p-3.5 shadow-[0_24px_50px_-20px_rgba(11,11,12,0.4)] transition-all duration-700 sm:-right-8 ${
          ticket ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        aria-hidden={!ticket}
      >
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          Your inbox · just now
        </div>
        <div className="mt-1.5 text-[13px] font-semibold">Refund request · torn bag</div>
        <div className="mt-0.5 text-[12px] leading-snug text-muted">Full conversation and a suggested reply are ready for you.</div>
      </div>
    </div>
  )
}
