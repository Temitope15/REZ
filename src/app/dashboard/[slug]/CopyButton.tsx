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
      {copied ? 'Copied' : label}
    </button>
  )
}
