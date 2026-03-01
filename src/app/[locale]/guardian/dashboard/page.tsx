"use client"

import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { Calendar, Clock, CreditCard, FileText, UserPlus, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useTickets } from '@/hooks/use-tickets'
import { useReports } from '@/hooks/use-reports'
import { createClient } from '@/lib/supabase/client'
import { Booking, TicketBalance, Report } from '@/lib/types/database'
import { ProgressChart } from '@/components/reports/progress-chart'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'


export default function GuardianHome() {
  const t = useTranslations('guardianDashboard')
  const tc = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings(user?.id, 'guardian')
  const { balances, loading: ticketsLoading } = useTickets(user?.id, 'guardian')
  const { reports, loading: reportsLoading } = useReports(user?.id, 'guardian')
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({})

  // Resolve teacher UUIDs to display names
  const supabaseForNames = useMemo(() => createClient(), [])
  useEffect(() => {
    const teacherIds = [...new Set(bookings.map((b: Booking) => b.teacher_id))]
    if (teacherIds.length === 0) return
    supabaseForNames
      .from('users')
      .select('id, name')
      .in('id', teacherIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach((u: { id: string; name: string | null }) => {
            map[u.id] = u.name || u.id
          })
          setTeacherNames(map)
        }
      })
  }, [bookings, supabaseForNames])

  const stats = useMemo(() => {
    const upcomingList = bookings.filter((b: Booking) => new Date(b.start_time) > new Date())
    const nextVal = upcomingList[0] ? format(new Date(upcomingList[0].start_time), 'PPP p', { locale: ja }) : '-'
    const nextDesc = upcomingList[0] ? t('teacherLabel', { name: teacherNames[upcomingList[0].teacher_id] || upcomingList[0].teacher_id }) : '-'

    const totalMin = balances.reduce((a: number, b: TicketBalance) => a + (b.remaining_minutes || 0), 0)
    const nearest = [...balances]
      .filter((tb: TicketBalance) => tb.expires_at)
      .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())[0]
    const balanceValue = `${totalMin}${tc('minutes')}`
    const balanceDesc = nearest?.expires_at ? t('nearestExpiry', { date: format(new Date(nearest.expires_at), 'PPP', { locale: ja }) }) : '-'

    const newReportsCount = String(reports.length)
    const uniqueTeachers = new Set(bookings.map((b: Booking) => b.teacher_id))

    return [
      { title: t('nextBooking'), value: nextVal, description: nextDesc, icon: Clock, color: 'text-brand-600 dark:text-brand-400', href: '/guardian/booking' },
      { title: t('ticketBalance'), value: balanceValue, description: balanceDesc, icon: CreditCard, color: 'text-green-600 dark:text-green-400', href: '/guardian/tickets' },
      { title: t('newReports'), value: newReportsCount, description: t('newReportsDescription'), icon: FileText, color: 'text-purple-600 dark:text-purple-400', href: '/guardian/reports' },
      { title: t('assignedTeachers'), value: `${uniqueTeachers.size}${tc('people')}`, description: '-', icon: UserPlus, color: 'text-orange-600 dark:text-orange-400', href: '/guardian/bookings' },
    ]
  }, [bookings, balances, reports, teacherNames])

  const upcoming = useMemo(() => bookings.filter((b: Booking) => new Date(b.start_time) > new Date()).slice(0, 5), [bookings])
  const recentReports = useMemo(() => reports.slice(0, 10), [reports])

  // Learning progress data
  const supabase = useMemo(() => createClient(), [])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})

  const progressData = useMemo(() => {
    const grouped: Record<string, { levels: { date: string; level: number }[] }> = {}
    reports.forEach((r: Report) => {
      if (!r.comprehension_level || !r.published_at || !r.profile_id) return
      if (!grouped[r.profile_id]) grouped[r.profile_id] = { levels: [] }
      grouped[r.profile_id].levels.push({ date: r.published_at, level: r.comprehension_level })
    })
    Object.values(grouped).forEach(g => {
      g.levels.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      g.levels = g.levels.slice(-10)
    })
    return Object.entries(grouped)
      .filter(([, g]) => g.levels.length >= 2)
      .map(([profileId, g]) => ({ profileId, levels: g.levels }))
  }, [reports])

  useEffect(() => {
    const ids = progressData.map(p => p.profileId).filter(id => !profileNames[id])
    if (ids.length === 0) return
    const uniqueIds = [...new Set(ids)]
    supabase.from('student_profiles').select('id,name').in('id', uniqueIds).then(({ data }) => {
      if (data) {
        setProfileNames(prev => {
          const next = { ...prev }
          data.forEach(p => { next[p.id] = p.name })
          return next
        })
      }
    })
  }, [progressData, supabase, profileNames])

  const loading = authLoading || bookingsLoading || ticketsLoading || reportsLoading
  const error = null // Error handling could be improved by consolidating hook errors

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>

        {error && <ErrorAlert message={tc('dataFetchError', { error })} />}

        {/* Stats Grid */}
        {loading ? <SkeletonStatsGrid count={4} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { title: t('newBooking'), description: t('newBookingDesc'), href: '/guardian/booking', icon: Calendar, isPrimary: true },
            { title: t('purchaseTicket'), description: t('purchaseTicketDesc'), href: '/guardian/tickets', icon: ShoppingCart, isPrimary: false },
            { title: t('bookingHistory'), description: t('bookingHistoryDesc'), href: '/guardian/bookings', icon: Clock, isPrimary: false },
            { title: t('reportView'), description: t('reportViewDesc'), href: '/guardian/reports', icon: FileText, isPrimary: false },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className={`cursor-pointer transition-all hover:shadow-md ${action.isPrimary ? 'border-brand-200 dark:border-brand-700/30 bg-brand-50 dark:bg-brand-900/30' : ''}`}>
                  <CardContent className="flex items-center p-6">
                    <Icon className={`h-8 w-8 mr-4 ${action.isPrimary ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-slate-400'}`} />
                    <div>
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('upcomingBookings')}</CardTitle>
              <CardDescription>{t('upcomingBookingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcoming.map((b: Booking) => (
                  <div key={b.id} className="flex items-center justify-between p-4 border dark:border-brand-800/20 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                        <span className="mx-1">-</span>
                        {format(new Date(b.end_time), 'p', { locale: ja })}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">{t('teacherLabel', { name: teacherNames[b.teacher_id] || b.teacher_id })}</div>
                    </div>
                    <div>
                      {b.status === 'confirmed' ? (
                        <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">{tc('confirmed')}</Badge>
                      ) : (
                        <Badge variant="secondary">{tc('pending')}</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <EmptyState
                    icon={Clock}
                    title={t('noSchedule')}
                    description={t('noScheduleDescription')}
                    action={{ label: t('noScheduleAction'), href: "/guardian/booking" }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recentReports')}</CardTitle>
              <CardDescription>{t('recentReportsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((r: Report) => (
                  <div key={r.id} className="p-4 border dark:border-brand-800/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{t('reportLabel')}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      {r.published_at ? format(new Date(r.published_at), 'PPP', { locale: ja }) : '-'}
                    </div>
                    {r.content_public && (
                      <p className="text-sm text-gray-700 dark:text-slate-300 mt-2 line-clamp-2">{r.content_public}</p>
                    )}
                  </div>
                ))}
                {recentReports.length === 0 && (
                  <EmptyState
                    icon={FileText}
                    title={t('noReports')}
                    description={t('noReportsDescription')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Progress */}
        {progressData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('learningProgress')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {progressData.map((pd) => (
                <ProgressChart
                  key={pd.profileId}
                  studentName={profileNames[pd.profileId] || tc('student')}
                  data={pd.levels}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  )
}

