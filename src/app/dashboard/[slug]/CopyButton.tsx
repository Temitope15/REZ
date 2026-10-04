'use client'

import {useState} from 'react'
import {buttonClass} from '../../ui'

export function CopyButton({text, label = 'Copy'}: {text: string; label?: string}) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={buttonClass('secondary', 'sm')}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch {
          /* clipboard blocked; user can still select the text */
        }
      }}
    >
      {copied ? (<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="pop"><path d="m5 12 5 5 9-10" /></svg>Copied</>) : label}
    </button>
  )
}
