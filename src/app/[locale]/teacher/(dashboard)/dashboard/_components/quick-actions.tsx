"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      color: 'text-brand-600 dark:text-brand-400',
    },
    {
      icon: FileText,
      label: t('quickActionWriteReport'),
      href: '/teacher/reports/new' as const,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: UserPlus,
      label: t('quickActionInviteStudent'),
      href: '/teacher/profile' as const,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: MessageCircle,
      label: t('quickActionOpenChat'),
      href: '/teacher/chat' as const,
      color: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('quickActionsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}>
                <div className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-brand-200 dark:hover:border-brand-700/30 cursor-pointer">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
