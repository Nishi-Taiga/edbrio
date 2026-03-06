"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useReports } from '@/hooks/use-reports'
import { useUnreadCount } from '@/hooks/use-unread-count'
import { useBookingReports } from '@/hooks/use-booking-reports'
import { type CalendarEvent } from '@/components/dashboard/teacher-calendar'
import { createClient } from '@/lib/supabase/client'
import { Booking, Report } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { getMissingSetupItems } from '@/lib/teacher-setup'
import { toast } from 'sonner'

import { SetupBanner } from './_components/setup-banner'
import { UpcomingLessons } from './_components/upcoming-lessons'
import { QuickActions } from './_components/quick-actions'

// Responsive components (unified mobile + desktop)
import { ResponsiveSummary } from './_components/responsive-summary'
import { ResponsiveCalendar } from './_components/responsive-calendar'
import { ResponsiveTasks } from './_components/responsive-tasks'
import { ResponsiveStats } from './_components/responsive-stats'

export default function TeacherDashboard() {
  const t = useTranslations('teacherDashboard')
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
  const [ticketPriceMap, setTicketPriceMap] = useState<Record<string, number>>({})

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

  // Fetch ticket pricing for income calculation
  useEffect(() => {
    if (bookings.length === 0) return
    const balanceIds = [...new Set(
      bookings
        .filter((b: Booking) => b.ticket_balance_id)
        .map((b: Booking) => b.ticket_balance_id!)
    )]
    if (balanceIds.length === 0) return

    supabase
      .from('ticket_balances')
      .select('id, tickets(price_cents, bundle_qty)')
      .in('id', balanceIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, number> = {}
          for (const tb of data) {
            const ticket = tb.tickets as unknown as { price_cents: number; bundle_qty: number } | null
            if (ticket && ticket.bundle_qty > 0) {
              map[tb.id] = ticket.price_cents / ticket.bundle_qty / 100
            }
          }
          setTicketPriceMap(map)
        }
      })
  }, [bookings, supabase])

  // ── Derived data ──

  const now = useMemo(() => new Date(), [])
  const todayStart = useMemo(() => {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d
  }, [now])
  const todayEnd = useMemo(() => {
    const d = new Date(todayStart); d.setDate(d.getDate() + 1); return d
  }, [todayStart])

  const todayBookings = useMemo(() =>
    bookings.filter((b: Booking) => {
      const start = new Date(b.start_time)
      return start >= todayStart && start < todayEnd && b.status !== 'canceled'
    }),
    [bookings, todayStart, todayEnd]
  )

  const todayCount = todayBookings.length

  const completedTodayCount = useMemo(() =>
    todayBookings.filter((b: Booking) => b.status === 'done').length,
    [todayBookings]
  )

  const nextLesson = useMemo(() =>
    bookings
      .filter((b: Booking) => b.status === 'confirmed' && new Date(b.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] ?? null,
    [bookings, now]
  )

  const pendingBookings = useMemo(() =>
    bookings.filter((b: Booking) => b.status === 'pending'),
    [bookings]
  )

  const reportedBookingIds = useMemo(() =>
    new Set(reports.filter((r: Report) => r.booking_id).map((r: Report) => r.booking_id)),
    [reports]
  )

  const needsReportBookings = useMemo(() =>
    bookings.filter((b: Booking) => b.status === 'done' && !reportedBookingIds.has(b.id)),
    [bookings, reportedBookingIds]
  )

  const calendarEvents: CalendarEvent[] = useMemo(() =>
    bookings
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
      }),
    [bookings, studentNames, reportedBookingIds, tc]
  )

  // Income calculations
  const calcIncome = (filteredBookings: Booking[]) =>
    filteredBookings
      .filter((b: Booking) => (b.status === 'confirmed' || b.status === 'done') && b.ticket_balance_id)
      .reduce((sum, b) => sum + (ticketPriceMap[b.ticket_balance_id!] || 0), 0)

  const todayEstimatedIncome = useMemo(
    () => calcIncome(todayBookings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayBookings, ticketPriceMap]
  )

  const thisMonthBookings = useMemo(() =>
    bookings.filter((b: Booking) => {
      const d = new Date(b.start_time)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && b.status !== 'canceled'
    }),
    [bookings, now]
  )

  const lastMonthBookings = useMemo(() => {
    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return bookings.filter((b: Booking) => {
      const d = new Date(b.start_time)
      return d.getFullYear() === ly && d.getMonth() === lm && b.status !== 'canceled'
    })
  }, [bookings, now])

  const thisMonthIncome = useMemo(
    () => calcIncome(thisMonthBookings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thisMonthBookings, ticketPriceMap]
  )
  const lastMonthIncome = useMemo(
    () => calcIncome(lastMonthBookings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastMonthBookings, ticketPriceMap]
  )

  const thisMonthDone = useMemo(() =>
    thisMonthBookings.filter((b: Booking) => b.status === 'done').length,
    [thisMonthBookings]
  )

  const upcomingLessons = useMemo(() =>
    bookings
      .filter((b: Booking) =>
        (b.status === 'confirmed' || b.status === 'pending') && new Date(b.start_time) > now
      )
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5),
    [bookings, now]
  )

  // ── Handlers ──

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
  const greetingText = t('greeting', { name: dbUser?.name || '', greeting })

  const loading = authLoading || bookingsLoading || reportsLoading

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="bg-[#F9F6F2] md:bg-[#F3F4F6] dark:bg-[#13111C] min-h-screen px-4 md:px-5 lg:px-7 py-4 md:py-6 space-y-5 pb-24 md:pb-6">

        {/* ── Setup Banner (conditional) ── */}
        {setupComplete === false && (
          <SetupBanner missingItems={missingItems} totalItems={4} />
        )}

        {/* ── Summary (full width, responsive) ── */}
        <ResponsiveSummary
          greeting={greetingText}
          todayCount={todayCount}
          completedTodayCount={completedTodayCount}
          nextLesson={nextLesson}
          studentNames={studentNames}
          todayEstimatedIncome={todayEstimatedIncome}
          loading={loading}
        />

        {/* ── Calendar + Tasks ── */}
        <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 560 }}>
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            <ResponsiveCalendar
              calendarEvents={calendarEvents}
              loading={loading}
              bookings={bookings}
              reportedBookingIds={reportedBookingIds}
              studentNames={studentNames}
            />
          </div>
          <div className="w-full lg:w-[380px] shrink-0 order-1 lg:order-2">
            <ResponsiveTasks
              loading={loading}
              needsReportBookings={needsReportBookings}
              pendingBookings={pendingBookings}
              issueReportCount={issueReportCount}
              unreadCount={unreadCount}
              studentNames={studentNames}
              isUpdating={isUpdating}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>

        {/* ── Bottom Row: Monthly Stats + Upcoming Lessons + Quick Actions ── */}
        <div className="flex flex-col md:flex-row gap-5" style={{ minHeight: 320 }}>
          <div className="flex-1 min-w-0">
            <ResponsiveStats
              thisMonthDone={thisMonthDone}
              thisMonthTotal={thisMonthBookings.length}
              lastMonthDone={lastMonthBookings.filter((b: Booking) => b.status === 'done').length}
              lastMonthTotal={lastMonthBookings.length}
              thisMonthIncome={thisMonthIncome}
              lastMonthIncome={lastMonthIncome}
              loading={loading}
            />
          </div>
          <div className="flex-1 min-w-0">
            <UpcomingLessons
              upcomingLessons={upcomingLessons}
              studentNames={studentNames}
              loading={loading}
            />
          </div>
          <div className="w-full md:w-[380px] shrink-0">
            <QuickActions />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
