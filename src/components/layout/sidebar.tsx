'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  const guardianItems = [
    { href: '/guardian/dashboard', label: 'ホーム' },
    { href: '/guardian/booking', label: '予約' },
    { href: '/guardian/tickets', label: 'チケット' },
    { href: '/guardian/bookings', label: '予約履歴' },
    { href: '/guardian/reports', label: 'レポート' },
  ]

  const teacherItems = [
    { href: '/teacher/dashboard', label: 'ダッシュボード' },
    { href: '/teacher/calendar', label: 'カレンダー' },
    { href: '/teacher/tickets', label: 'チケット' },
    { href: '/teacher/students', label: '生徒カルテ' },
    { href: '/teacher/reports', label: 'レポート' },
    { href: '/teacher/bookings', label: '予約一覧' },
    { href: '/teacher/profile', label: 'プロフィール' },
  ]

  const items = isGuardian ? guardianItems : teacherItems

  return (
    <nav className={mobile ? 'h-full p-4' : 'hidden lg:block h-full p-4'}>
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
                    'block rounded px-3 py-2 text-sm',
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
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
