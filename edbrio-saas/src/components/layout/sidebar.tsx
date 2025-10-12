'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

export function Sidebar() {
  const pathname = usePathname()
  const isGuardian = pathname?.startsWith('/guardian')

  const guardianItems = [
    { href: '/guardian/home', label: 'ホーム' },
    { href: '/guardian/dashboard', label: 'ダッシュボード' },
    { href: '/guardian/booking', label: '予約' },
    { href: '/guardian/tickets', label: 'チケット' },
    { href: '/guardian/bookings', label: '予約履歴' },
    { href: '/guardian/reports', label: 'レポート' },
  ]

  const teacherItems = [
    { href: '/teacher/dashboard', label: 'ダッシュボード' },
    { href: '/teacher/calendar', label: 'カレンダー' },
    { href: '/teacher/tickets', label: 'チケット' },
    { href: '/teacher/reports', label: 'レポート' },
    { href: '/teacher/bookings', label: '予約一覧' },
    { href: '/teacher/profile', label: 'プロフィール' },
  ]

  const items = isGuardian ? guardianItems : teacherItems

  return (
    <nav className="hidden lg:block h-full p-4">
      <ul className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={classNames(
                  'block rounded px-3 py-2 text-sm',
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900'
                )}
              >
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

