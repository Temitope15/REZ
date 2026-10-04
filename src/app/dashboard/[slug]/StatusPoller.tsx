'use client'

import {useRouter} from 'next/navigation'
import {useEffect} from 'react'

/** While ingestion runs, re-render the page every few seconds so status and counts update. */
export function StatusPoller({id}: {id: string}) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/businesses/${id}/ingest`, {cache: 'no-store'})
        const j = await r.json()
        router.refresh()
        if (j.status === 'ready' || j.status === 'error') clearInterval(t)
      } catch {
        /* keep polling */
      }
    }, 4000)
    return () => clearInterval(t)
  }, [id, router])
  return null
}
