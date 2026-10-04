'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'

export function OnboardForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    let websiteUrl = String(fd.get('websiteUrl') || '').trim()
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`
    const payload = {
      name: String(fd.get('name') || '').trim(),
      websiteUrl,
      escalationEmail: String(fd.get('escalationEmail') || '').trim(),
    }
    try {
      const r = await fetch('/api/businesses', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(payload)})
      const j = await r.json()
      if (!r.ok && !j.slug) throw new Error(j.error || 'Something went wrong. Please try again.')
      router.push(`/dashboard/${j.slug}`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line-strong bg-surface p-7 shadow-[0_40px_80px_-40px_rgba(11,11,12,0.35)] sm:p-8">
      <div className="font-display text-[24px]" style={{letterSpacing: '-0.03em'}}>Set up REZ</div>
      <p className="mt-1 text-[14px] text-muted">Three questions. That’s all.</p>
      <div className="mt-6 grid gap-4">
        <label className="label">Your business name<input name="name" required placeholder="Acme Coffee" className="field" autoComplete="organization" /></label>
        <label className="label">Your website<input name="websiteUrl" required placeholder="acmecoffee.com" className="field" inputMode="url" autoComplete="url" /></label>
        <label className="label">
          Your email
          <span className="hint">We’ll send questions REZ can’t answer here.</span>
          <input name="escalationEmail" type="email" required placeholder="you@acmecoffee.com" className="field" autoComplete="email" />
        </label>
        {error && <p className="rounded-xl bg-bad-soft px-3 py-2 text-[13px] text-bad">{error}</p>}
        <button disabled={busy} className="group mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-[15px] font-medium text-white transition hover:bg-ink-2 disabled:opacity-60">
          {busy ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" /> Getting started…
            </>
          ) : (
            <>
              Build my assistant
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </>
          )}
        </button>
        <p className="text-center text-[12px] text-faint">REZ starts reading your site right away. You can watch it happen.</p>
      </div>
    </form>
  )
}
