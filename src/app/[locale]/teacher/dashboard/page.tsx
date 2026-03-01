"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, Calendar, DollarSign, FileText, Settings, Users } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useTickets } from '@/hooks/use-tickets'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking, Ticket, Payment } from '@/lib/types/database'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useTranslations } from 'next-intl'


export default function TeacherDashboard() {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')
  const { user, dbUser, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings(user?.id, 'teacher')
  const { tickets: activeTickets, loading: ticketsLoading } = useTickets(user?.id, 'teacher')
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)

  const supabase = useMemo(() => createClient(), [])

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
        .select('is_onboarding_complete')
        .eq('id', user!.id)
        .maybeSingle()
      setSetupComplete(data?.is_onboarding_complete ?? false)
    }
    checkSetup()
  }, [user, dbUser, supabase])

  const upcoming = useMemo(() => bookings.filter((b: Booking) => b.status === 'confirmed').slice(0, 5), [bookings])
  const activeTicketCount = useMemo(() => activeTickets.filter((t: Ticket) => t.is_active).length, [activeTickets])
  const studentCount = useMemo(() => new Set(bookings.map((b: Booking) => b.student_id)).size, [bookings])

  const loading = authLoading || bookingsLoading || ticketsLoading || revenueLoading
  const error = null

  const formatYen = (cents: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((cents || 0) / 100)

  const quickActions = [
    { title: t('studentKarte'), description: t('studentKarteDesc'), href: '/teacher/students', icon: Users },
    { title: t('calendarManagement'), description: t('calendarManagementDesc'), href: '/teacher/calendar', icon: Calendar },
    { title: t('ticketManagement'), description: t('ticketManagementDesc'), href: '/teacher/tickets', icon: DollarSign },
    { title: t('reportCreate'), description: t('reportCreateDesc'), href: '/teacher/reports', icon: FileText },
    { title: t('profileSettings'), description: t('profileSettingsDesc'), href: '/teacher/profile', icon: Settings },
  ]

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-gray-600 dark:text-slate-400">{t('description')}</p>
        </div>

        {setupComplete === false && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">{t('initialSetupIncomplete')}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">{t('initialSetupDescription')}</p>
                </div>
              </div>
              <Link href="/teacher/profile">
                <Button variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30 whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-1.5" />
                  {t('goToProfile')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {error && <ErrorAlert message={tc('dataFetchError', { error })} />}

        {loading ? <SkeletonStatsGrid count={3} /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('monthlyRevenue')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatYen(monthRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('activeStudents')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{studentCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 dark:text-slate-400">{t('activeTickets')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeTicketCount}</div></CardContent>
          </Card>
        </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('upcomingBookings')}</CardTitle>
                <CardDescription>{t('upcomingDescription')}</CardDescription>
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
                      <div key={b.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                            <span className="mx-1">-</span>
                            {format(new Date(b.end_time), 'p', { locale: ja })}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-slate-400">{t('studentId', { id: b.student_id })}</div>
                        </div>
                        <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
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
