'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {buttonClass, cx} from './ui'

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
      if (!r.ok && !j.slug) throw new Error(j.error || 'Something went wrong')
      router.push(`/dashboard/${j.slug}`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-surface p-6 shadow-[0_24px_60px_-30px_rgba(23,22,27,0.25)] sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Build your support agent</h2>
      <p className="mt-1 text-sm text-muted">Three fields. REZ does the rest in a few minutes.</p>
      <div className="mt-6 grid gap-4">
        <label className="label">Business name<input name="name" required placeholder="Acme Bikes" className="field" /></label>
        <label className="label">Website<input name="websiteUrl" required placeholder="acmebikes.com" className="field" inputMode="url" /></label>
        <label className="label">
          Where should unresolved tickets go?
          <input name="escalationEmail" type="email" required placeholder="support@acmebikes.com" className="field" />
        </label>
        {error && <p className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        <button disabled={busy} className={cx(buttonClass('primary'), 'mt-1 py-3')}>
          {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
          {busy ? 'Starting…' : 'Build my support agent'}
        </button>
      </div>
      <ol className="mt-6 grid gap-2 border-t border-line pt-5 text-[13px] text-muted">
        <li className="flex gap-2"><span className="font-mono text-faint">01</span> Reads up to 40 pages of your site</li>
        <li className="flex gap-2"><span className="font-mono text-faint">02</span> Writes small, sourced answers into Sanity</li>
        <li className="flex gap-2"><span className="font-mono text-faint">03</span> Builds a Sanity Context knowledge base and gives you one script tag</li>
      </ol>
    </form>
  )
}
