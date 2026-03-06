'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Home, FileText, Calendar, MessageCircle, LayoutGrid, Ticket, GraduationCap, Settings, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-unread-count'

export function MobileFooter() {
  const t = useTranslations('teacherDashboard')
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()
  const { count: unreadCount } = useUnreadCount(user?.id, 'teacher')

  const isActive = (href: string) => pathname === href || (href !== '/teacher/dashboard' && pathname?.startsWith(href))

  const tabs = [
    { icon: Home, label: t('footerHome'), href: '/teacher/dashboard' as const },
    { icon: FileText, label: t('footerReports'), href: '/teacher/reports' as const },
  ]

  const tabsRight = [
    { icon: Calendar, label: t('footerCalendar'), href: '/teacher/calendar' as const },
    { icon: MessageCircle, label: t('footerChat'), href: '/teacher/chat' as const },
  ]

  const fabMenuItems = [
    { icon: Ticket, label: 'チケット', href: '/teacher/tickets' as const },
    { icon: GraduationCap, label: '生徒カリキュラム', href: '/teacher/curriculum' as const },
    { icon: Settings, label: '設定', href: '/teacher/profile' as const },
  ]

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  // Prevent body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), [])

  const renderTab = (tab: { icon: any; label: string; href: '/teacher/dashboard' | '/teacher/reports' | '/teacher/calendar' | '/teacher/chat' }) => {
    const Icon = tab.icon
    const active = isActive(tab.href)
    const showBadge = tab.href === '/teacher/chat' && unreadCount > 0
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors relative
          ${active ? 'bg-[#EDE8F5] dark:bg-[#282237]' : ''}`}
      >
        <div className="relative">
          <Icon className={`w-[22px] h-[22px] ${active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-[#6B7280] dark:text-[#6D5A8A]'}`} />
          {showBadge && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-semibold ${active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-[#6B7280] dark:text-[#6D5A8A]'}`}>
          {tab.label}
        </span>
      </Link>
    )
  }

  return (
    <>
      {/* FAB Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[45] md:hidden bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* FAB Menu Items */}
      <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[46] md:hidden flex flex-col items-center gap-3
        transition-all duration-300 ease-out
        ${menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {fabMenuItems.map((item, i) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <span className="text-sm font-medium text-white bg-black/70 dark:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg whitespace-nowrap">
                {item.label}
              </span>
              <span className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg
                ${active
                  ? 'bg-[#7C3AED] dark:bg-[#A78BFA] text-white'
                  : 'bg-white dark:bg-[#2E2840] text-[#7C3AED] dark:text-[#A78BFA]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
            </Link>
          )
        })}
      </div>

      {/* Footer bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div
          className="relative h-16 flex items-center justify-around px-2 py-1.5
            bg-white/[0.93] dark:bg-[#1E1A2B]/[0.93] backdrop-blur-[20px]
            border-t border-[#E5E0D8] dark:border-[#2E2840]
            shadow-[0_-4px_16px_rgba(0,0,0,0.07)]"
        >
          {/* Left tabs */}
          {tabs.map(renderTab)}

          {/* FAB spacer */}
          <div className="w-16 shrink-0" />

          {/* Right tabs */}
          {tabsRight.map(renderTab)}

          {/* FAB button */}
          <button
            onClick={toggleMenu}
            className={`absolute left-1/2 -translate-x-1/2 bottom-[12px] w-16 h-16 rounded-full
              flex items-center justify-center
              shadow-[0_4px_12px_rgba(124,58,237,0.25)] dark:shadow-[0_4px_12px_rgba(167,139,250,0.25)]
              transition-all duration-300 ease-out
              ${menuOpen
                ? 'bg-[#5B21B6] dark:bg-[#8B5CF6] rotate-45 scale-95'
                : 'bg-[#7C3AED] dark:bg-[#A78BFA] rotate-0 scale-100 active:scale-95'
              }`}
          >
            {menuOpen ? (
              <X className="w-[28px] h-[28px] text-white transition-transform duration-300 -rotate-45" />
            ) : (
              <LayoutGrid className="w-[30px] h-[30px] text-white" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}
