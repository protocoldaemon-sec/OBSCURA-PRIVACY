import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface CardProps {
  title: string
  description: string
  href: string
  icon?: ReactNode
}

export default function Card({ title, description, href, icon }: CardProps) {
  return (
    <Link
      to={href}
      className="block p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/50 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-secondary)] group-hover:bg-[var(--accent-primary)]/20 transition-colors">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)] transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}
