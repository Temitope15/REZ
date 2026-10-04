/* Line-art illustrations, drawn on scroll (stroke-dash animation in globals.css). */

const common = {fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const}

export function ArtLink() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full text-ink">
      <rect className="draw" x="10" y="22" width="100" height="36" rx="18" {...common} />
      <path className="draw" d="M30 40h40" {...common} />
      <circle cx="88" cy="40" r="9" fill="currentColor" />
      <path d="M85 40h6m-2-3 3 3-3 3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArtLearn() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full text-ink">
      <rect className="draw" x="14" y="14" width="40" height="52" rx="4" {...common} />
      <path className="draw" d="M22 26h24M22 34h18M22 42h22M22 50h14" {...common} />
      <path className="draw" d="M58 40h10" {...common} />
      <rect className="draw" x="72" y="16" width="34" height="14" rx="4" {...common} />
      <rect className="draw" x="72" y="33" width="34" height="14" rx="4" {...common} />
      <rect className="draw" x="72" y="50" width="34" height="14" rx="4" {...common} />
    </svg>
  )
}

export function ArtInstall() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full text-ink">
      <rect className="draw" x="12" y="12" width="96" height="56" rx="6" {...common} />
      <path className="draw" d="M12 24h96" {...common} />
      <path className="draw" d="M24 38h40M24 46h28" {...common} />
      <circle cx="94" cy="56" r="8" fill="currentColor" />
      <path d="M90.5 54.5h7v4h-4.5l-2.5 2v-6z" fill="#fff" />
    </svg>
  )
}

/** Website → Sanity → Knowledge base → Customer, as a quiet flow diagram. */
export function SanityFlow() {
  const nodes = [
    {x: 20, label: 'Your website', sub: 'pages & policies'},
    {x: 220, label: 'Sanity', sub: 'organized answers'},
    {x: 420, label: 'Knowledge base', sub: 'built by Sanity Context'},
    {x: 620, label: 'Your customer', sub: 'gets a sourced reply'},
  ]
  return (
    <svg viewBox="0 0 780 140" className="w-full text-ink" role="img" aria-label="Your website flows into Sanity, becomes a knowledge base, and answers your customer">
      {nodes.slice(0, -1).map((n, i) => (
        <g key={i}>
          <path className="draw" d={`M${n.x + 150} 56 H${nodes[i + 1].x - 10}`} {...common} strokeDasharray="4 5" />
          <path d={`M${nodes[i + 1].x - 16} 51 l6 5 -6 5`} {...common} />
        </g>
      ))}
      {nodes.map((n, i) => (
        <g key={n.label}>
          <rect x={n.x} y="28" width="150" height="56" rx="14" fill={i === 1 || i === 2 ? '#0b0b0c' : '#fff'} stroke="#0b0b0c" strokeWidth="1.4" />
          <text x={n.x + 75} y="61" textAnchor="middle" fontSize="15" fontWeight="700" fill={i === 1 || i === 2 ? '#fff' : '#0b0b0c'} style={{fontFamily: 'var(--font-display-face)'}}>
            {n.label}
          </text>
          <text x={n.x + 75} y="110" textAnchor="middle" fontSize="12.5" fill="#6b6a6e">{n.sub}</text>
        </g>
      ))}
    </svg>
  )
}
