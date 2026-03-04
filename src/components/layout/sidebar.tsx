'use client'

import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-unread-count'
import { useBookingReports } from '@/hooks/use-booking-reports'
import { ChevronUp, LogOut, Mail, Settings, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isGuardian = pathname?.startsWith('/guardian')
  const { user, dbUser, signOut } = useAuth()
  const t = useTranslations('sidebar')
  const role = isGuardian ? 'guardian' as const : 'teacher' as const
  const { count: unreadCount } = useUnreadCount(user?.id, role)
  const { pendingCount: pendingReportCount } = useBookingReports(
    !isGuardian ? user?.id : undefined,
    'teacher'
  )

  const guardianItems = [
    { href: '/guardian/dashboard', label: t('guardian.home') },
    { href: '/guardian/booking', label: t('guardian.booking') },
    { href: '/guardian/tickets', label: t('guardian.tickets') },
    { href: '/guardian/bookings', label: t('guardian.bookings') },
    { href: '/guardian/reports', label: t('guardian.reports') },
    { href: '/guardian/chat', label: t('guardian.chat'), badge: unreadCount },
  ]

  const teacherItems = [
    { href: '/teacher/dashboard', label: t('teacher.dashboard') },
    { href: '/teacher/reports', label: t('teacher.reports') },
    { href: '/teacher/calendar', label: t('teacher.calendar'), badge: pendingReportCount },
    { href: '/teacher/chat', label: t('teacher.chat'), badge: unreadCount },
    { href: '/teacher/curriculum', label: t('teacher.students') },
    { href: '/teacher/tickets', label: t('teacher.tickets') },
  ]

  const items = isGuardian ? guardianItems : teacherItems

  const profilePath = isGuardian ? '/guardian/contact' : '/teacher/profile'
  const contactPath = isGuardian ? '/guardian/contact' : '/teacher/contact'

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
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700 font-medium border-l-[3px] border-brand-600 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                  )}
                >
                  {it.label}
                  {'badge' in it && it.badge ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                      {it.badge}
                    </Badge>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* User menu */}
        {user && (
          <div className="mt-4 border-t pt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="font-medium truncate">{dbUser?.name || user.email}</span>
                  </div>
                  <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => { onClose?.(); router.push(profilePath) }}
                >
                  <Settings className="w-4 h-4" />
                  {t('userMenu.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => { onClose?.(); router.push(contactPath) }}
                >
                  <Mail className="w-4 h-4" />
                  {t('userMenu.contact')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4" />
                  {t('userMenu.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  )
}
