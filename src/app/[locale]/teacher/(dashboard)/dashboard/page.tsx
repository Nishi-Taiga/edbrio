"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, Calendar, Check, Clock, DollarSign, FileText, Settings, Users, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useTickets } from '@/hooks/use-tickets'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useReports } from '@/hooks/use-reports'
import { createClient } from '@/lib/supabase/client'
import { format, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking, Ticket, Payment, Report } from '@/lib/types/database'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useTranslations } from 'next-intl'
import { getMissingSetupItems } from '@/lib/teacher-setup'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'
import { toast } from 'sonner'


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

  // Fetch monthly revenue
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

  // Resolve student UUIDs to names (from bookings)
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

  const activeTicketCount = useMemo(() => activeTickets.filter((t: Ticket) => t.is_active).length, [activeTickets])

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

  const hasActionItems = pendingBookings.length > 0 || draftReports.length > 0

  const quickActions = [
    { title: t('reportCreate'), description: t('reportCreateDesc'), href: '/teacher/reports/new', icon: FileText },
    { title: t('calendarManagement'), description: t('calendarManagementDesc'), href: '/teacher/calendar', icon: Calendar },
    { title: t('studentKarte'), description: t('studentKarteDesc'), href: '/teacher/curriculum', icon: Users },
    { title: t('bookingManagement'), description: t('bookingManagementDesc'), href: '/teacher/bookings', icon: Clock },
  ]

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-gray-600 dark:text-slate-400">{t('description')}</p>
        </div>

        {/* Setup Alert */}
        {setupComplete === false && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">{t('initialSetupIncomplete')}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                    {t('initialSetupDescriptionDynamic', { items: missingItems.map(k => tp(k)).join('・') })}
                  </p>
                </div>
              </div>
              <Link href="/teacher/setup">
                <Button variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30 whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-1.5" />
                  {t('goToSetup')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Action Required Banner */}
        {!loading && hasActionItems && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-blue-800 dark:text-blue-300">{t('actionRequired')}</p>
                  {pendingBookings.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {t('pendingBookingsAction', { count: pendingBookings.length })}
                    </p>
                  )}
                  {draftReports.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {t('draftReportsAction', { count: draftReports.length })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <ErrorAlert message={tc('dataFetchError', { error })} />}

        {/* Stats Grid - 4 cards */}
        {loading ? <SkeletonStatsGrid count={4} /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('todayLessons')}</CardTitle>
                <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{todayBookings.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('monthlyRevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatYen(monthRevenue)}</div></CardContent>
          </Card>
          <Link href="/teacher/curriculum">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700/30 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('activeStudents')}</CardTitle>
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{activeStudentCount}</div></CardContent>
            </Card>
          </Link>
          <Link href="/teacher/tickets">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700/30 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('activeTickets')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{activeTicketCount}</div></CardContent>
            </Card>
          </Link>
        </div>
        )}

        {/* Main content: 2/3 + 1/3 layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Schedule */}
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
                  <div className="space-y-3">
                    {todayBookings.map((b: Booking) => (
                      <div key={b.id} className="flex items-center justify-between p-3 border dark:border-brand-800/20 rounded-lg">
                        <div>
                          <div className="font-medium">
                            {format(new Date(b.start_time), 'p', { locale: ja })}
                            <span className="mx-1">-</span>
                            {format(new Date(b.end_time), 'p', { locale: ja })}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                            {t('studentLabel', { name: studentNames[b.student_id] || b.student_id })}
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
                      <div key={b.id} className="flex items-center justify-between p-3 border dark:border-brand-800/20 rounded-lg">
                        <div>
                          <div className="font-medium">
                            {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                            <span className="mx-1">-</span>
                            {format(new Date(b.end_time), 'p', { locale: ja })}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                            {t('studentLabel', { name: studentNames[b.student_id] || b.student_id })}
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

          {/* Right column - 1/3 */}
          <div className="space-y-8">
            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pendingApprovals')}</CardTitle>
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
                      <div key={b.id} className="p-3 border dark:border-brand-800/20 rounded-lg">
                        <div className="font-medium text-sm">
                          {t('studentLabel', { name: studentNames[b.student_id] || b.student_id })}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                          {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                          <span className="mx-1">-</span>
                          {format(new Date(b.end_time), 'p', { locale: ja })}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 hover:text-red-700"
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
                        <div className="p-3 border dark:border-brand-800/20 rounded-lg hover:bg-gray-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer">
                          <div className="font-medium text-sm">
                            {r.profile_id ? (profileNames[r.profile_id] || tc('student')) : tc('student')}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('quickActions')}</CardTitle>
                <CardDescription>{t('quickActionsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((a) => {
                    const Icon = a.icon
                    return (
                      <Link key={a.title} href={a.href}>
                        <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer">
                          <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400 mr-3" />
                          <div>
                            <div className="font-medium text-sm">{a.title}</div>
                            <div className="text-xs text-gray-600 dark:text-slate-400">{a.description}</div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
