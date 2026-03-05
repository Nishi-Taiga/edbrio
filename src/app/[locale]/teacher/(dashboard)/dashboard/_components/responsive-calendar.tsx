"use client"

import { Booking } from '@/lib/types/database'
import { TeacherDashboardCalendar, type CalendarEvent } from '@/components/dashboard/teacher-calendar'
import { MobileCalendarCard } from './mobile-calendar-card'
import { useTranslations } from 'next-intl'

interface ResponsiveCalendarProps {
  // For desktop calendar
  calendarEvents: CalendarEvent[]
  loading: boolean
  // For mobile calendar
  bookings: Booking[]
  reportedBookingIds: Set<string | null>
  studentNames: Record<string, string>
}

export function ResponsiveCalendar({
  calendarEvents,
  loading,
  bookings,
  reportedBookingIds,
  studentNames,
}: ResponsiveCalendarProps) {
  const t = useTranslations('teacherDashboard')

  return (
    <>
      {/* Mobile: date picker + list */}
      <div className="md:hidden">
        <MobileCalendarCard
          bookings={bookings}
          reportedBookingIds={reportedBookingIds}
          studentNames={studentNames}
          loading={loading}
        />
      </div>

      {/* Desktop: time grid calendar */}
      <div className="hidden md:block h-full rounded-2xl border border-gray-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
          </div>
        ) : (
          <TeacherDashboardCalendar
            events={calendarEvents}
            title={t('calendarTitle')}
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
      </div>
    </>
  )
}
