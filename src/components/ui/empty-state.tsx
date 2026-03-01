import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button size="sm">{action.label}</Button>
          </Link>
        ) : action.onClick ? (
          <Button size="sm" onClick={action.onClick}>{action.label}</Button>
        ) : null
      )}
    </div>
  )
}
