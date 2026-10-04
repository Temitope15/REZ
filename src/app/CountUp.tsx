'use client'

import {useEffect, useRef, useState} from 'react'

/** Counts from 0 to `value` with an ease-out when it first appears. */
export function CountUp({value, duration = 900}: {value: number; duration?: number}) {
  const [n, setN] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (done.current) {
      setN(value)
      return
    }
    done.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || value === 0) {
      setN(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <span className="tabular-nums">{n}</span>
}
