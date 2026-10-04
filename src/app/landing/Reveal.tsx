'use client'

import {useEffect, useRef, type ReactNode} from 'react'

/** Fades children up when they scroll into view. Staggers with `delay` (ms). */
export function Reveal({children, delay = 0, className = '', as: Tag = 'div'}: {children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li'}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('is-in')
            io.disconnect()
          }
        }
      },
      {threshold: 0.15, rootMargin: '0px 0px -40px 0px'},
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    // @ts-expect-error polymorphic ref
    <Tag ref={ref} className={`reveal ${className}`} style={{transitionDelay: `${delay}ms`}}>
      {children}
    </Tag>
  )
}
