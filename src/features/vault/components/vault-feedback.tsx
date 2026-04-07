import type { ReactNode } from 'react'

type VaultFeedbackVariant = 'info' | 'error' | 'success'

const VARIANT_STYLES: Record<VaultFeedbackVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/80 dark:bg-red-950/60 dark:text-red-300',
  info: 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/60 dark:text-emerald-300',
}

interface VaultFeedbackProps {
  action?: ReactNode
  compact?: boolean
  description?: string
  title: string
  variant?: VaultFeedbackVariant
}

export default function VaultFeedback({
  action,
  compact = false,
  description,
  title,
  variant = 'info',
}: VaultFeedbackProps) {
  return (
    <div className={`rounded-xl border text-center shadow-sm ${compact ? 'p-3' : 'p-5'} ${VARIANT_STYLES[variant]}`}>
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="mt-2 text-sm opacity-90">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
