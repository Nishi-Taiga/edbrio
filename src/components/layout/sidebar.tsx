'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isGuardian = pathname?.startsWith('/guardian')
  const { user, dbUser, signOut } = useAuth()
  const t = useTranslations('sidebar')

  const guardianItems = [
    { href: '/guardian/dashboard', label: t('guardian.home') },
    { href: '/guardian/booking', label: t('guardian.booking') },
    { href: '/guardian/tickets', label: t('guardian.tickets') },
    { href: '/guardian/bookings', label: t('guardian.bookings') },
    { href: '/guardian/reports', label: t('guardian.reports') },
    { href: '/guardian/contact', label: t('guardian.contact') },
  ]

  const teacherItems = [
    { href: '/teacher/dashboard', label: t('teacher.dashboard') },
    { href: '/teacher/calendar', label: t('teacher.calendar') },
    { href: '/teacher/tickets', label: t('teacher.tickets') },
    { href: '/teacher/students', label: t('teacher.students') },
    { href: '/teacher/reports', label: t('teacher.reports') },
    { href: '/teacher/bookings', label: t('teacher.bookings') },
    { href: '/teacher/profile', label: t('teacher.profile') },
    { href: '/teacher/contact', label: t('teacher.contact') },
  ]

  const items = isGuardian ? guardianItems : teacherItems

  return (
    <nav className="h-full p-4">
      <div className="h-full flex flex-col">
        {mobile && (
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <ul className="space-y-1 flex-1">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== '/teacher/dashboard' && it.href !== '/guardian/dashboard' && pathname?.startsWith(it.href))
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={onClose}
                  className={classNames(
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700 font-medium border-l-[3px] border-brand-600 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                  )}
                >
                  {it.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Account section */}
        {user && (
          <div className="mt-4 border-t pt-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <div>
                  <div className="font-medium leading-tight">{dbUser?.name || user.email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{dbUser?.role}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-600 dark:text-gray-300">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
