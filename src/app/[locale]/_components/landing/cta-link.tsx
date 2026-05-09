'use client'

import { Link } from '@/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface CtaLinkProps {
  href: string
  location: string
  className?: string
  children: React.ReactNode
}

export function CtaLink({ href, location, className, children }: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent({ name: 'cta_click', params: { location } })}
    >
      {children}
    </Link>
  )
}

interface CtaButtonProps {
  variant?: 'primary' | 'secondary'
  href: string
  location: string
  className?: string
  children: React.ReactNode
}

export function CtaButton({ variant = 'primary', href, location, className, children }: CtaButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors'
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: cn(
      'bg-transparent text-foreground hover:bg-gray-950/5 dark:hover:bg-white/5',
      'ring-1 ring-gray-950/10 dark:ring-white/10'
    ),
  }

  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      onClick={() => trackEvent({ name: 'cta_click', params: { location } })}
    >
      {children}
    </Link>
  )
}
