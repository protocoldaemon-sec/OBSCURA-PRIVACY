import type { ReactNode } from 'react'

type BadgeVariant = 'get' | 'post' | 'put' | 'delete' | 'required' | 'optional' | 'warning'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  get: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  post: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  put: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  delete: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
  required: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
  optional: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]',
  warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
