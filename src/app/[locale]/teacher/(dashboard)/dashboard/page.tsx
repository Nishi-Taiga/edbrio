"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, Calendar, Check, CheckCircle2, FileText, MessageCircle, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useReports } from '@/hooks/use-reports'
import { useUnreadCount } from '@/hooks/use-unread-count'
import { useBookingReports } from '@/hooks/use-booking-reports'
import { TeacherDashboardCalendar, type CalendarEvent } from '@/components/dashboard/teacher-calendar'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking, Report } from '@/lib/types/database'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { useTranslations } from 'next-intl'
import { getMissingSetupItems } from '@/lib/teacher-setup'
import { toast } from 'sonner'

export default function TeacherDashboard() {
  const t = useTranslations('teacherDashboard')
  const tp = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const { user, dbUser, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading, updateBookingStatus } = useBookings(user?.id, 'teacher')
  const { reports, loading: reportsLoading } = useReports(user?.id, 'teacher')
  const { count: unreadCount } = useUnreadCount(user?.id, 'teacher')
  const { pendingCount: issueReportCount } = useBookingReports(user?.id, 'teacher')

  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Check setup completion
  useEffect(() => {
    if (!user?.id || dbUser?.role !== 'teacher') return
    async function checkSetup() {
      const { data } = await supabase
        .from('teachers')
        .select('subjects,grades,public_profile,is_onboarding_complete')
        .eq('id', user!.id)
        .maybeSingle()
      if (data) {
        const missing = getMissingSetupItems(
          data.subjects || [],
          data.grades || [],
          data.public_profile || {}
        )
        setSetupComplete(missing.length === 0)
        setMissingItems(missing)
      } else {
        setSetupComplete(false)
      }
    }
    checkSetup()
  }, [user, dbUser, supabase])

  // Resolve student UUIDs to names
  useEffect(() => {
    if (bookings.length === 0) return
    const ids = [...new Set(bookings.map((b: Booking) => b.student_id))]
    supabase
      .from('student_profiles')
      .select('student_id, name')
      .in('student_id', ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach((p: { student_id: string | null; name: string }) => {
            if (p.student_id) map[p.student_id] = p.name
          })
          setStudentNames(map)
        }
      })
  }, [bookings, supabase])

  // Derived data
  const todayCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return bookings.filter((b: Booking) => {
      const start = new Date(b.start_time)
      return start >= today && start < tomorrow && b.status !== 'canceled'
    }).length
  }, [bookings])

  const pendingBookings = useMemo(() =>
    bookings.filter((b: Booking) => b.status === 'pending'),
    [bookings]
  )

  // Reports that are missing: bookings with status 'done' and no matching report
  const reportedBookingIds = useMemo(() =>
    new Set(reports.filter((r: Report) => r.booking_id).map((r: Report) => r.booking_id)),
    [reports]
  )

  const needsReportBookings = useMemo(() =>
    bookings.filter((b: Booking) => b.status === 'done' && !reportedBookingIds.has(b.id)),
    [bookings, reportedBookingIds]
  )

  // Calendar events — color-coded
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return bookings
      .filter((b: Booking) => b.status !== 'canceled')
      .map((b: Booking) => {
        const name = studentNames[b.student_id] || ''
        const isDone = b.status === 'done'
        const hasReport = reportedBookingIds.has(b.id)

        let color: 'blue' | 'red' | 'green'
        if (isDone && hasReport) color = 'green'
        else if (isDone) color = 'red'
        else color = 'blue'

        return {
          id: b.id,
          title: name || tc('student'),
          start: new Date(b.start_time),
          end: new Date(b.end_time),
          color,
        }
      })
  }, [bookings, studentNames, reportedBookingIds, tc])

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'canceled') => {
    setIsUpdating(id)
    try {
      await updateBookingStatus(id, status)
      toast.success(status === 'confirmed' ? t('approveSuccess') : t('rejectSuccess'))
    } catch {
      toast.error(tc('updateFailed'))
    } finally {
      setIsUpdating(null)
    }
  }

  // Time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening')

  const loading = authLoading || bookingsLoading || reportsLoading

  // Task items config
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
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-6 sm:py-8">

        {/* ── Welcome Header ── */}
        <div className="relative rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-900 dark:to-brand-800 p-6 sm:p-8 mb-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-56 h-28 bg-accent-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {t('greeting', { name: dbUser?.name || '', greeting })}
            </h1>
            <p className="text-brand-100 dark:text-brand-300 text-sm sm:text-base">
              {todayCount > 0
                ? t('todaySummary', { count: todayCount })
                : t('noLessonsTodaySummary')}
            </p>
          </div>
        </div>

        {/* ── Setup Banner ── */}
        {setupComplete === false && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">{t('initialSetupIncomplete')}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    {missingItems.length > 0
                      ? t('initialSetupDescriptionDynamic', { items: missingItems.map(k => tp(k)).join('・') })
                      : t('initialSetupDescription')}
                  </p>
                  <Link href="/teacher/setup">
                    <Button size="sm" variant="outline" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30">
                      {t('goToSetup')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Main Content: Calendar + Tasks ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{t('calendarTitle')}</CardTitle>
                  <Link href="/teacher/calendar">
                    <Button variant="ghost" size="sm">{t('calendarManagement')}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
                  </div>
                ) : (
                  <TeacherDashboardCalendar
                    events={calendarEvents}
                    labels={{
                      weekView: t('calendarWeekView'),
                      monthView: t('calendarMonthView'),
                      booked: t('calendarLegendBooked'),
                      needsReport: t('calendarLegendNeedsReport'),
                      done: t('calendarLegendDone'),
                      noEvents: t('calendarNoEvents'),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tasks */}
          <div className="lg:col-span-2">
            <Card>
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
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                            </div>
                            <Badge variant="secondary" className={`text-xs ${item.badgeColor}`}>
                              {item.countLabel}
                            </Badge>
                          </div>

                          {/* Expandable content for needs-report */}
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

                          {/* Expandable content for pending bookings */}
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
                                      onClick={() => handleStatusUpdate(b.id, 'canceled')}
                                      disabled={isUpdating === b.id}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                      onClick={() => handleStatusUpdate(b.id, 'confirmed')}
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

                          {/* Link action for issue reports & unread messages */}
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
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
