'use client'

import {useEffect, useRef, useState} from 'react'

/**
 * Shown right after a business signs up: the one line they paste on their site.
 * Copying it takes them to their dashboard, where they can watch REZ read their website.
 */
export function InstallModal({name, publicKey, onDone}: {name: string; publicKey: string; onDone: () => void}) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const snippet = `<script src="${origin}/widget.js" data-rez-key="${publicKey}" async></script>`

  useEffect(() => {
    setOrigin(window.location.origin)
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDone()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onDone])

  async function copyAndContinue() {
    try {
      await navigator.clipboard.writeText(snippet)
    } catch {
      /* clipboard blocked: the code is still visible to copy by hand */
    }
    setCopied(true)
    setTimeout(onDone, 900)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="fade-in absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onDone} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="pop relative w-full max-w-lg rounded-3xl border border-line-strong bg-surface p-7 text-left shadow-[0_40px_100px_-30px_rgba(11,11,12,0.6)] outline-none sm:p-8"
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
        </div>
        <h2 id="install-title" className="font-display mt-5 text-[26px] leading-tight" style={{letterSpacing: '-0.03em'}}>
          {name} is set up
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          REZ is reading your website now. Add this one line to your site, just before <code className="font-mono text-[13px] text-ink-2">&lt;/body&gt;</code>, and a chat bubble will appear.
        </p>

        <pre className="mt-5 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-white">{snippet}</pre>

        <button
          onClick={copyAndContinue}
          className="press group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-[15px] font-medium text-white hover:bg-ink-2"
        >
          {copied ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="pop"><path d="m5 12 5 5 9-10" /></svg>
              Copied. Taking you to your dashboard…
            </>
          ) : (
            <>
              Copy code and go to my dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </>
          )}
        </button>
        <button onClick={onDone} className="mt-3 w-full text-center text-[13px] text-muted hover:text-ink">
          I’ll add it later
        </button>
        <p className="mt-4 text-center text-[12px] text-faint">You can always find this code in your dashboard under Install.</p>
      </div>
    </div>
  )
}
