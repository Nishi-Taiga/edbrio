"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, Calendar, Check, CheckCircle2, FileText, MessageCircle, X } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TaskPanelProps {
  loading: boolean
  needsReportBookings: Booking[]
  pendingBookings: Booking[]
  issueReportCount: number
  unreadCount: number
  studentNames: Record<string, string>
  isUpdating: string | null
  onStatusUpdate: (id: string, status: 'confirmed' | 'canceled') => void
}

export function TaskPanel({
  loading,
  needsReportBookings,
  pendingBookings,
  issueReportCount,
  unreadCount,
  studentNames,
  isUpdating,
  onStatusUpdate,
}: TaskPanelProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  const taskItems = [
    {
      key: 'needsReport',
      icon: FileText,
      title: t('needsReportTitle'),
      count: needsReportBookings.length,
      countLabel: t('needsReportCount', { count: needsReportBookings.length }),
      href: '/teacher/reports/new',
      actionLabel: t('needsReportAction'),
      color: 'text-red-600 dark:text-red-400',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      expandable: true,
    },
    {
      key: 'pendingBookings',
      icon: Calendar,
      title: t('pendingBookingsTitle'),
      count: pendingBookings.length,
      countLabel: t('pendingBookingsCount', { count: pendingBookings.length }),
      href: undefined,
      actionLabel: undefined,
      color: 'text-amber-600 dark:text-amber-400',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      expandable: true,
    },
    {
      key: 'issueReports',
      icon: AlertTriangle,
      title: t('issueReportsTitle'),
      count: issueReportCount,
      countLabel: t('issueReportsCount', { count: issueReportCount }),
      href: '/teacher/calendar',
      actionLabel: t('issueReportsAction'),
      color: 'text-orange-600 dark:text-orange-400',
      badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
      expandable: false,
    },
    {
      key: 'unreadMessages',
      icon: MessageCircle,
      title: t('unreadMessagesTitle'),
      count: unreadCount,
      countLabel: t('unreadMessagesCount', { count: unreadCount }),
      href: '/teacher/chat',
      actionLabel: t('unreadMessagesAction'),
      color: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      expandable: false,
    },
  ]

  const allTasksDone = taskItems.every(item => item.count === 0)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>{t('tasksTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonList count={4} />
        ) : allTasksDone ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">{t('tasksAllDone')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {taskItems.filter(item => item.count > 0).map((item) => {
              const Icon = item.icon
              return (
                <div key={item.key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${item.badgeColor}`}>
                      {item.countLabel}
                    </Badge>
                  </div>

                  {item.key === 'needsReport' && (
                    <div className="mt-2 space-y-1.5">
                      {needsReportBookings.slice(0, 3).map((b: Booking) => (
                        <div key={b.id} className="flex items-center justify-between text-xs text-muted-foreground pl-6">
                          <span>
                            {studentNames[b.student_id] || tc('student')}
                            <span className="mx-1">·</span>
                            {format(new Date(b.start_time), 'M/d p', { locale: ja })}
                          </span>
                        </div>
                      ))}
                      {needsReportBookings.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-6">
                          +{needsReportBookings.length - 3}件
                        </p>
                      )}
                      <Link href="/teacher/reports/new">
                        <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs">
                          {item.actionLabel}
                        </Button>
                      </Link>
                    </div>
                  )}

                  {item.key === 'pendingBookings' && (
                    <div className="mt-2 space-y-2">
                      {pendingBookings.slice(0, 3).map((b: Booking) => (
                        <div key={b.id} className="flex items-center justify-between pl-6">
                          <div className="text-xs text-muted-foreground">
                            <span>{studentNames[b.student_id] || tc('student')}</span>
                            <span className="mx-1">·</span>
                            <span>{format(new Date(b.start_time), 'M/d p', { locale: ja })}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => onStatusUpdate(b.id, 'canceled')}
                              disabled={isUpdating === b.id}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={() => onStatusUpdate(b.id, 'confirmed')}
                              disabled={isUpdating === b.id}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {pendingBookings.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-6">
                          +{pendingBookings.length - 3}件
                        </p>
                      )}
                    </div>
                  )}

                  {item.href && !item.expandable && (
                    <Link href={item.href}>
                      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs">
                        {item.actionLabel}
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
