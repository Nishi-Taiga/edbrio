"use client"

import { Link } from '@/i18n/navigation'
import { Home, FileText, Calendar, MessageCircle, LayoutGrid } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function MobileFooter() {
  const t = useTranslations('teacherDashboard')

  const tabs = [
    { icon: Home, label: t('footerHome'), href: '/teacher/dashboard' as const, active: true },
    { icon: FileText, label: t('footerReports'), href: '/teacher/reports' as const, active: false },
  ]

  const tabsRight = [
    { icon: Calendar, label: t('footerCalendar'), href: '/teacher/calendar' as const, active: false },
    { icon: MessageCircle, label: t('footerChat'), href: '/teacher/chat' as const, active: false },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Footer bar */}
      <div
        className="relative h-16 flex items-center justify-around px-2 py-1.5
          bg-white/[0.93] dark:bg-[#1E1A2B]/[0.93] backdrop-blur-[20px]
          border-t border-[#E5E0D8] dark:border-[#2E2840]
          shadow-[0_-4px_16px_rgba(0,0,0,0.07)]"
      >
        {/* Left tabs */}
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl
                ${tab.active ? 'bg-[#EDE8F5] dark:bg-[#282237]' : ''}`}
            >
              <Icon className={`w-[22px] h-[22px] ${tab.active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-[#6B7280] dark:text-[#6D5A8A]'}`} />
              <span className={`text-[10px] font-semibold ${tab.active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-[#6B7280] dark:text-[#6D5A8A]'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* FAB spacer */}
        <div className="w-16 shrink-0" />

        {/* Right tabs */}
        {tabsRight.map(tab => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg
                ${tab.active ? 'bg-[#EDE8F5] dark:bg-[#282237]' : ''}`}
            >
              <Icon className={`w-[22px] h-[22px] ${tab.active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-[#6B7280] dark:text-[#6D5A8A]'}`} />
              <span className={`text-[10px] font-semibold ${tab.active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-[#6B7280] dark:text-[#6D5A8A]'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* FAB button */}
        <button
          className="absolute left-1/2 -translate-x-1/2 bottom-[12px] w-16 h-16 rounded-full
            bg-[#7C3AED] dark:bg-[#A78BFA]
            flex items-center justify-center
            shadow-[0_4px_12px_rgba(124,58,237,0.25)] dark:shadow-[0_4px_12px_rgba(167,139,250,0.25)]
            active:scale-95 transition-transform"
        >
          <LayoutGrid className="w-[30px] h-[30px] text-white" />
        </button>
      </div>
    </div>
  )
}
