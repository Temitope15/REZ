'use client'

import {useFormStatus} from 'react-dom'
import {buttonClass, cx, type ButtonVariant} from '../../ui'

/** A form submit button that shows a pending state while its server action runs. */
export function SubmitButton({children, pendingLabel, variant = 'secondary', size = 'md', disabled, className}: {
  children: React.ReactNode
  pendingLabel?: string
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}) {
  const {pending} = useFormStatus()
  return (
    <button type="submit" disabled={disabled || pending} className={cx(buttonClass(variant, size), className)}>
      {pending && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {pending ? pendingLabel ?? 'Working…' : children}
    </button>
  )
}
