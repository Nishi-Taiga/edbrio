"use client"

import { Link } from '@/i18n/navigation'
import { CalendarPlus, FileText, UserPlus, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function QuickActions() {
  const t = useTranslations('teacherDashboard')

  const actions = [
    {
      icon: CalendarPlus,
      label: t('quickActionAddSlot'),
      href: '/teacher/calendar' as const,
      iconColor: 'text-[#7C3AED]',
      bg: 'bg-[#EDE8F5] dark:bg-[#282237]',
    },
    {
      icon: FileText,
      label: t('quickActionWriteReport'),
      href: '/teacher/reports/new' as const,
      iconColor: 'text-[#EF4444]',
      bg: 'bg-[#FEF2F2] dark:bg-[#2E1A1A]',
    },
    {
      icon: UserPlus,
      label: t('quickActionInviteStudent'),
      href: '/teacher/profile' as const,
      iconColor: 'text-[#10B981]',
      bg: 'bg-[#ECFDF5] dark:bg-[#1A2E28]',
    },
    {
      icon: MessageCircle,
      label: t('quickActionOpenChat'),
      href: '/teacher/chat' as const,
      iconColor: 'text-[#3B82F6]',
      bg: 'bg-[#EFF6FF] dark:bg-[#1E2A40]',
    },
  ]

  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] p-4 lg:p-5 flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-500 dark:text-[#9CA3AF] tracking-widest uppercase">{t('quickActionsTitle')}</h3>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href}>
              <div className={`flex flex-col items-center justify-center gap-2 rounded-xl ${action.bg} p-4 h-full transition-opacity hover:opacity-80 cursor-pointer`}>
                <Icon className={`w-6 h-6 ${action.iconColor}`} />
                <span className={`text-sm font-bold text-center leading-tight ${action.iconColor}`}>
                  {action.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
