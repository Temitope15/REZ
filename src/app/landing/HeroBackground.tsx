'use client'

import {useEffect, useRef} from 'react'

/**
 * A living dot field behind the hero. A slow wave rolls across the grid and dots near the
 * cursor swell, like a quiet pulse. The centre is faded out so the headline stays crisp.
 * Pauses when off-screen; static for reduced-motion users.
 */
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const GAP = 26
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let visible = true
    const mouse = {x: -9999, y: -9999, tx: -9999, ty: -9999}

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h)
      mouse.x += (mouse.tx - mouse.x) * 0.12
      mouse.y += (mouse.ty - mouse.y) * 0.12
      const t = time * 0.001
      const cx = w / 2
      const cy = h * 0.32
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          // Rolling wave: two slow sines crossing the grid.
          const wave = Math.sin(x * 0.011 + t * 0.9) + Math.cos(y * 0.013 - t * 0.7) + Math.sin((x + y) * 0.006 + t * 0.4)
          const n = (wave + 3) / 6 // 0..1
          // Cursor halo
          const dx = x - mouse.x
          const dy = y - mouse.y
          const md = Math.sqrt(dx * dx + dy * dy)
          const near = Math.max(0, 1 - md / 160)
          // Keep the headline area calm
          const ex = (x - cx) / (w * 0.42)
          const ey = (y - cy) / (h * 0.34)
          const centre = Math.min(1, Math.sqrt(ex * ex + ey * ey))
          const fadeEdge = Math.min(1, y / 60, (h - y) / 120)
          const alpha = (0.05 + n * 0.16 + near * 0.45) * (0.25 + 0.75 * centre) * Math.max(0, fadeEdge)
          const r = 0.7 + n * 1.1 + near * 1.8
          if (alpha < 0.01) continue
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(11,11,12,${alpha.toFixed(3)})`
          ctx.fill()
        }
      }
      if (!reduce && visible) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.tx = e.clientX - rect.left
      mouse.ty = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.tx = -9999
      mouse.ty = -9999
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(draw)
    })
    io.observe(canvas)
    window.addEventListener('pointermove', onMove, {passive: true})
    canvas.parentElement!.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0" />
}

const FLOATERS = [
  {q: 'Where’s my order?', left: '6%', top: '30%', delay: '0s'},
  {q: 'Do you ship abroad?', left: '78%', top: '22%', delay: '2.2s'},
  {q: 'Can I return this?', left: '10%', top: '58%', delay: '4.4s'},
  {q: 'What are your hours?', left: '80%', top: '52%', delay: '6.6s'},
  {q: 'Is this in stock?', left: '3%', top: '80%', delay: '3.3s'},
  {q: 'How do I cancel?', left: '84%', top: '78%', delay: '7.7s'},
]

/** Customer questions drifting up at the edges of the hero, each picking up a tick as it gets answered. */
export function FloatingQuestions() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {FLOATERS.map((f) => (
        <div key={f.q} className="float-q absolute" style={{left: f.left, top: f.top, animationDelay: f.delay}}>
          <div className="flex items-center gap-2 rounded-full border border-line-strong bg-surface/90 py-1.5 pl-3.5 pr-1.5 text-[13px] text-ink-2 shadow-[0_8px_24px_-14px_rgba(11,11,12,0.35)] backdrop-blur">
            {f.q}
            <span className="tick grid h-5 w-5 place-items-center rounded-full bg-ink text-white" style={{animationDelay: f.delay}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
