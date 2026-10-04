'use client'

import {useEffect, useRef, useState} from 'react'
import {useFormStatus} from 'react-dom'
import {buttonClass, cx, type ButtonVariant} from '../../ui'

/**
 * Form submit button with three states: idle, working (spinner), and a brief "done" check
 * after the server action finishes, so every save feels acknowledged.
 */
export function SubmitButton({children, pendingLabel, doneLabel = 'Done', variant = 'secondary', size = 'md', disabled, className}: {
  children: React.ReactNode
  pendingLabel?: string
  doneLabel?: string
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}) {
  const {pending} = useFormStatus()
  const [done, setDone] = useState(false)
  const was = useRef(false)

  useEffect(() => {
    if (was.current && !pending) {
      setDone(true)
      const t = setTimeout(() => setDone(false), 1800)
      was.current = pending
      return () => clearTimeout(t)
    }
    was.current = pending
  }, [pending])

  return (
    <button type="submit" disabled={disabled || pending} className={cx(buttonClass(variant, size), className)}>
      {pending ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {pendingLabel ?? 'Working…'}
        </>
      ) : done ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="pop"><path d="m5 12 5 5 9-10" /></svg>
          {doneLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
