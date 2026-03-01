'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, FileText, Calendar, Ticket, Shield } from 'lucide-react'

const items = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin/payments', label: '決済管理', icon: CreditCard },
  { href: '/admin/reports', label: 'レポート分析', icon: FileText },
  { href: '/admin/bookings', label: '予約分析', icon: Calendar },
  { href: '/admin/tickets', label: 'チケット管理', icon: Ticket },
  { href: '/admin/audit', label: '監査ログ', icon: Shield },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav className="h-full p-4 flex flex-col">
      <div className="mb-6 px-3">
        <div className="text-sm font-bold text-brand-600 dark:text-brand-400">EdBrio</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Admin Console</div>
      </div>
      <ul className="space-y-1 flex-1">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== '/admin/dashboard' && pathname?.startsWith(it.href))
          const Icon = it.icon
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium border-l-[3px] border-brand-600 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 border-t pt-3 px-3">
        <div className="text-xs text-slate-400 dark:text-slate-500">EdBrio Admin v1.0</div>
      </div>
    </nav>
  )
}
