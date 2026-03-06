'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, LayoutDashboard, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

interface AdminSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin/payments', label: '決済管理', icon: BarChart3 },
  { href: '/admin/reports', label: 'レポート監視', icon: FileText },
]

export function AdminSidebar({ mobile, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

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
        <div className="mb-4 px-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            管理者メニュー
          </div>
        </div>
        <ul className="space-y-1 flex-1">
          {navItems.map((it) => {
            const active = pathname === it.href || (it.href !== '/admin/dashboard' && pathname?.startsWith(it.href))
            const Icon = it.icon
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={onClose}
                  className={classNames(
                    'flex items-center gap-2 rounded px-3 py-2 text-sm',
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {it.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
