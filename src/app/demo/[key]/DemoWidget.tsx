'use client'

import {useEffect, useState} from 'react'

/** Installs the real REZ widget on the preview page, exactly as a business would on its own site. */
export function DemoWidget({publicKey, ready}: {publicKey: string; ready: boolean}) {
  const [hint, setHint] = useState(true)

  useEffect(() => {
    if (!ready) return
    const s = document.createElement('script')
    s.src = '/widget.js'
    s.async = true
    s.setAttribute('data-rez-key', publicKey)
    document.body.appendChild(s)
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.('.rez-btn')) setHint(false)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      s.remove()
      document.querySelector('.rez-btn')?.remove()
      document.querySelector('.rez-frame')?.remove()
      delete (window as unknown as {__rezLoaded?: boolean}).__rezLoaded
    }
  }, [publicKey, ready])

  if (!ready) {
    return (
      <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] text-white shadow-lg">
        <span className="h-2 w-2 rounded-full bg-white pulse-dot" /> REZ is still reading the website
      </div>
    )
  }
  if (!hint) return null
  return (
    <div className="pointer-events-none fixed bottom-[34px] right-[92px] hidden rounded-xl bg-ink px-3 py-2 text-[13px] text-white shadow-lg sm:block">
      Ask me anything
      <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 border-y-[6px] border-l-[6px] border-y-transparent border-l-ink" />
    </div>
  )
}
