'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, FileText, Calendar, Ticket, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

type NavKey = 'dashboard' | 'users' | 'payments' | 'reports' | 'bookings' | 'tickets' | 'audit'

const itemDefs: { href: string; key: NavKey; icon: typeof LayoutDashboard }[] = [
  { href: '/admin/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/users', key: 'users', icon: Users },
  { href: '/admin/payments', key: 'payments', icon: CreditCard },
  { href: '/admin/reports', key: 'reports', icon: FileText },
  { href: '/admin/bookings', key: 'bookings', icon: Calendar },
  { href: '/admin/tickets', key: 'tickets', icon: Ticket },
  { href: '/admin/audit', key: 'audit', icon: Shield },
]

interface AdminSidebarProps {
  onClose?: () => void
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('adminNav')

  return (
    <nav className="h-full p-4 flex flex-col">
      {onClose && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
      <div className="mb-6 px-3">
        <div className="text-sm font-bold text-brand-600 dark:text-brand-400">EdBrio</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Admin Console</div>
      </div>
      <ul className="space-y-1 flex-1">
        {itemDefs.map((it) => {
          const active = pathname === it.href || (it.href !== '/admin/dashboard' && pathname?.startsWith(it.href))
          const Icon = it.icon
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium border-l-[3px] border-brand-600 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(it.key)}
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
