"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, Calendar, Check, DollarSign, FileText, Ticket, Users, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useTickets } from '@/hooks/use-tickets'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useReports } from '@/hooks/use-reports'
import { createClient } from '@/lib/supabase/client'
import { format, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking, Ticket as TicketType, Payment, Report } from '@/lib/types/database'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useTranslations } from 'next-intl'
import { getMissingSetupItems } from '@/lib/teacher-setup'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'
import { toast } from 'sonner'

const iconBgColors: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
}

export default function TeacherDashboard() {
  const t = useTranslations('teacherDashboard')
  const tp = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const { user, dbUser, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading, updateBookingStatus } = useBookings(user?.id, 'teacher')
  const { tickets: activeTickets, loading: ticketsLoading } = useTickets(user?.id, 'teacher')
  const { profiles, loading: profilesLoading } = useStudentProfiles(user?.id)
  const { reports, loading: reportsLoading } = useReports(user?.id, 'teacher')
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Fetch monthly revenue & check setup
  useEffect(() => {
    if (!user?.id || dbUser?.role !== 'teacher') return

    async function fetchRevenue() {
      setRevenueLoading(true)
      const start = new Date()
      start.setDate(1)
      const { data: pays } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('teacher_id', user!.id)
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())

      const rev = ((pays || []) as Payment[]).reduce((acc: number, p: Payment) => acc + (p.amount_cents || 0), 0)
      setMonthRevenue(rev)
      setRevenueLoading(false)
    }
    fetchRevenue()

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
          data.forEach((p: { student_id: string | null; name: string }) => { if (p.student_id) map[p.student_id] = p.name })
          setStudentNames(map)
        }
      })
  }, [bookings, supabase])

  // Resolve profile_id to names (for reports)
  useEffect(() => {
    const ids = reports
      .filter((r: Report) => r.profile_id)
      .map((r: Report) => r.profile_id!)
      .filter((id: string) => !profileNames[id])
    if (ids.length === 0) return
    const uniqueIds = [...new Set(ids)]
    supabase.from('student_profiles').select('id,name').in('id', uniqueIds).then(({ data }) => {
      if (data) {
        setProfileNames(prev => {
          const next = { ...prev }
          data.forEach((p: { id: string; name: string }) => { next[p.id] = p.name })
          return next
        })
      }
    })
  }, [reports, supabase, profileNames])

  // Derived data
  const todayBookings = useMemo(() =>
    bookings
      .filter((b: Booking) => isToday(new Date(b.start_time)) && b.status !== 'canceled')
      .sort((a: Booking, b: Booking) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [bookings]
  )

  const pendingBookings = useMemo(() =>
    bookings.filter((b: Booking) => b.status === 'pending'),
    [bookings]
  )

  const upcoming = useMemo(() =>
    bookings
      .filter((b: Booking) => new Date(b.start_time) > new Date() && b.status !== 'canceled')
      .slice(0, 5),
    [bookings]
  )

  const activeStudentCount = useMemo(() =>
    profiles.filter(p => p.status === 'active').length,
    [profiles]
  )

  const activeTicketCount = useMemo(() => activeTickets.filter((t: TicketType) => t.is_active).length, [activeTickets])
  const recentReports = useMemo(() => reports.slice(0, 5), [reports])
  const draftReports = useMemo(() => reports.filter((r: Report) => !r.published_at), [reports])

  const loading = authLoading || bookingsLoading || ticketsLoading || profilesLoading || reportsLoading || revenueLoading
  const error = null

  const formatYen = (cents: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((cents || 0) / 100)

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'canceled') => {
    setIsUpdating(id)
    try {
      await updateBookingStatus(id, status)
      toast.success(status === 'confirmed' ? t('approveSuccess') : t('rejectSuccess'))
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error(tc('updateFailed'))
    } finally {
      setIsUpdating(null)
    }
  }

  // Time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening')

  // Unified action items
  const actionItems: { text: string; href: string }[] = []
  if (setupComplete === false) actionItems.push({ text: t('setupAction'), href: '/teacher/setup' })
  if (pendingBookings.length > 0) actionItems.push({ text: t('pendingBookingsAction', { count: pendingBookings.length }), href: '/teacher/bookings' })
  if (draftReports.length > 0) actionItems.push({ text: t('draftReportsAction', { count: draftReports.length }), href: '/teacher/reports' })

  // Stat cards config
  const statCards = [
    { label: t('todayLessons'), value: todayBookings.length, icon: Calendar, color: 'brand', href: undefined as string | undefined },
    { label: t('monthlyRevenue'), value: formatYen(monthRevenue), icon: DollarSign, color: 'green', href: undefined as string | undefined },
    { label: t('activeStudents'), value: activeStudentCount, icon: Users, color: 'purple', href: '/teacher/curriculum' },
    { label: t('activeTickets'), value: activeTicketCount, icon: Ticket, color: 'orange', href: '/teacher/tickets' },
  ]

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
              {todayBookings.length > 0
                ? t('todaySummary', { count: todayBookings.length })
                : t('noLessonsTodaySummary')}
            </p>
          </div>
        </div>

        {/* ── Unified Action Banner ── */}
        {!loading && actionItems.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">{t('actionRequired')}</p>
                  {actionItems.map((item, i) => (
                    <Link key={i} href={item.href}>
                      <p className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors cursor-pointer">
                        {item.text}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <ErrorAlert message={tc('dataFetchError', { error })} />}

        {/* ── Stats Grid ── */}
        {loading ? <SkeletonStatsGrid count={4} /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon
              const inner = (
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.label}</span>
                      <div className={`rounded-full p-2 ${iconBgColors[stat.color]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  </CardContent>
                </Card>
              )
              return stat.href ? (
                <Link key={stat.label} href={stat.href} className="cursor-pointer">{inner}</Link>
              ) : (
                <div key={stat.label}>{inner}</div>
              )
            })}
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Today's Schedule - Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>{t('todaySchedule')}</CardTitle>
                <CardDescription>{t('todayScheduleDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonList count={3} />
                ) : todayBookings.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title={t('noLessonsToday')}
                    description={t('noLessonsTodayDesc')}
                    action={{ label: t('calendarManagement'), href: '/teacher/calendar' }}
                  />
                ) : (
                  <div className="relative pl-1">
                    {todayBookings.map((b: Booking, i: number) => {
                      const dotColor = b.status === 'confirmed'
                        ? 'bg-green-500 dark:bg-green-400'
                        : b.status === 'done'
                          ? 'bg-gray-400 dark:bg-gray-500'
                          : 'bg-amber-500 dark:bg-amber-400'
                      return (
                        <div key={b.id} className="flex gap-4">
                          <div className="flex flex-col items-center w-3">
                            <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                            {i < todayBookings.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 dark:bg-brand-800/30 my-1" />
                            )}
                          </div>
                          <div className={`flex-1 flex items-center justify-between ${i < todayBookings.length - 1 ? 'pb-5' : 'pb-1'}`}>
                            <div>
                              <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                {format(new Date(b.start_time), 'p', { locale: ja })}
                                <span className="mx-1.5">-</span>
                                {format(new Date(b.end_time), 'p', { locale: ja })}
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
                                {studentNames[b.student_id] || b.student_id}
                              </div>
                            </div>
                            <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>
                              {tc('statusLabels.' + b.status)}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('upcomingBookings')}</CardTitle>
                  <CardDescription>{t('upcomingDescription')}</CardDescription>
                </div>
                <Link href="/teacher/bookings">
                  <Button variant="ghost" size="sm">{t('viewAll')}</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonList count={3} />
                ) : upcoming.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title={t('noSchedule')}
                    description={t('noScheduleDescription')}
                  />
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((b: Booking) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-brand-800/20 hover:bg-gray-50 dark:hover:bg-brand-900/20 transition-colors">
                        <div>
                          <div className="font-medium text-sm">
                            {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                            <span className="mx-1">-</span>
                            {format(new Date(b.end_time), 'p', { locale: ja })}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                            {studentNames[b.student_id] || b.student_id}
                          </div>
                        </div>
                        <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>
                          {tc('statusLabels.' + b.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{t('pendingApprovals')}</CardTitle>
                  {pendingBookings.length > 0 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  )}
                </div>
                <CardDescription>{t('pendingApprovalsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonList count={2} />
                ) : pendingBookings.length === 0 ? (
                  <EmptyState
                    icon={Check}
                    title={t('noPendingApprovals')}
                    description={t('noPendingApprovalsDesc')}
                  />
                ) : (
                  <div className="space-y-3">
                    {pendingBookings.map((b: Booking) => (
                      <div key={b.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800/20 dark:bg-amber-900/10">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {studentNames[b.student_id] || b.student_id}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                          <span className="mx-1">-</span>
                          {format(new Date(b.end_time), 'p', { locale: ja })}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleStatusUpdate(b.id, 'canceled')}
                            disabled={isUpdating === b.id}
                          >
                            <X className="w-3 h-3 mr-1" /> {t('rejectButton')}
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                            disabled={isUpdating === b.id}
                          >
                            <Check className="w-3 h-3 mr-1" /> {t('approveButton')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('recentReports')}</CardTitle>
                  <CardDescription>{t('recentReportsDesc')}</CardDescription>
                </div>
                <Link href="/teacher/reports">
                  <Button variant="ghost" size="sm">{t('viewAll')}</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonList count={3} />
                ) : recentReports.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={t('noReportsYet')}
                    description={t('noReportsYetDesc')}
                    action={{ label: t('reportCreate'), href: '/teacher/reports/new' }}
                  />
                ) : (
                  <div className="space-y-3">
                    {recentReports.map((r: Report) => (
                      <Link key={r.id} href={`/teacher/reports/${r.id}`}>
                        <div className="p-3 rounded-lg border dark:border-brand-800/20 hover:bg-gray-50 dark:hover:bg-brand-900/20 hover:scale-[1.01] transition-all cursor-pointer">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {r.profile_id ? (profileNames[r.profile_id] || tc('student')) : tc('student')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {r.published_at ? format(new Date(r.published_at), 'PPP', { locale: ja }) : r.created_at ? format(new Date(r.created_at), 'PPP', { locale: ja }) : '-'}
                            {r.subject && <span className="ml-2">{r.subject}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {r.comprehension_level && <ComprehensionBadge level={r.comprehension_level} />}
                            {r.student_mood && <MoodIndicator mood={r.student_mood} />}
                            {!r.published_at && (
                              <Badge variant="secondary" className="text-xs">
                                {tc('draft')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
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
