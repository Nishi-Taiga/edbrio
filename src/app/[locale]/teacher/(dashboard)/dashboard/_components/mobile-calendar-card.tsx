"use client"

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday, format } from 'date-fns'

const WEEKDAY_KEYS_MON = ['weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat', 'weekdaySun'] as const
const WEEKDAY_KEYS_SUN = ['weekdaySun', 'weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat'] as const

interface Props {
  bookings: Booking[]
  reportedBookingIds: Set<string | null>
  studentNames: Record<string, string>
  loading: boolean
  weekStartsOn?: 0 | 1
}

export function MobileCalendarCard({ bookings, reportedBookingIds, studentNames, loading, weekStartsOn = 0 }: Props) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn }))

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const dayBookings = useMemo(() =>
    bookings
      .filter(b => {
        const d = new Date(b.start_time)
        return isSameDay(d, selectedDate) && b.status !== 'canceled'
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [bookings, selectedDate]
  )

  const goToday = () => {
    const now = new Date()
    setSelectedDate(now)
    setWeekStart(startOfWeek(now, { weekStartsOn }))
  }
  const goPrevWeek = () => setWeekStart(prev => subWeeks(prev, 1))
  const goNextWeek = () => setWeekStart(prev => addWeeks(prev, 1))

  const getAccentColor = (b: Booking) => {
    if (b.status === 'done') return reportedBookingIds.has(b.id) ? '#10B981' : '#EF4444'
    return '#3B82F6'
  }

  const getStatusInfo = (b: Booking) => {
    if (b.status === 'done' && reportedBookingIds.has(b.id))
      return { label: t('statusDone'), text: 'text-[#10B981]', bg: 'bg-[#ECFDF5] dark:bg-[#1A2E28]' }
    if (b.status === 'done')
      return { label: t('calendarLegendNeedsReport'), text: 'text-[#EF4444]', bg: 'bg-[#FEF2F2] dark:bg-[#2E1A1A]' }
    if (b.status === 'confirmed')
      return { label: t('statusConfirmed'), text: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF] dark:bg-[#1E2A40]' }
    return { label: t('statusPending'), text: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB] dark:bg-[#4A3D1A]' }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] p-4 pt-5 animate-pulse space-y-4">
        <div className="h-5 w-28 bg-gray-100 dark:bg-[#282237] rounded" />
        <div className="flex gap-2 justify-between">
          {[...Array(7)].map((_, i) => <div key={i} className="w-11 h-14 bg-gray-100 dark:bg-[#282237] rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-[#282237] rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] pt-5 px-4 pb-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#1E1E2E] dark:text-[#E8E4F0]">
          {t('calendarTitle')}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={goPrevWeek} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E0D8] dark:border-[#2E2840]">
            <ChevronLeft className="w-4 h-4 text-[#6B7280] dark:text-[#6D5A8A]" />
          </button>
          <button onClick={goToday} className="rounded-lg bg-[#EDE8F5] dark:bg-[#282237] px-3 py-1.5 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
            {t('calendarToday')}
          </button>
          <button onClick={goNextWeek} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E0D8] dark:border-[#2E2840]">
            <ChevronRight className="w-4 h-4 text-[#6B7280] dark:text-[#6D5A8A]" />
          </button>
        </div>
      </div>

      {/* Date Picker */}
      <div className="flex justify-between">
        {weekDays.map((day, i) => {
          const today = isToday(day)
          const selected = isSameDay(day, selectedDate)
          const isSat = i === 5
          const isSun = i === 6

          let wrapClass = ''
          let dayColor = 'text-[#6B7280] dark:text-[#6D5A8A]'
          let dateColor = 'text-[#1E1E2E] dark:text-[#E8E4F0]'
          let dateFontClass = 'text-base font-semibold'

          if (today) {
            wrapClass = 'bg-[#7C3AED] dark:bg-[#A78BFA]'
            dayColor = 'text-white dark:text-white font-semibold'
            dateColor = 'text-white dark:text-white'
            dateFontClass = 'text-lg font-extrabold'
          } else if (selected) {
            wrapClass = 'bg-[#EDE8F5] dark:bg-[#282237]'
            dayColor = 'text-[#7C3AED] dark:text-[#A78BFA]'
            dateColor = 'text-[#7C3AED] dark:text-[#A78BFA]'
          } else if (isSat) {
            dayColor = 'text-[#3B82F6]'
            dateColor = 'text-[#3B82F6]'
          } else if (isSun) {
            dayColor = 'text-[#EF4444]'
            dateColor = 'text-[#EF4444]'
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center justify-center gap-1 w-11 h-14 rounded-xl transition-colors ${wrapClass}`}
            >
              <span className={`text-[11px] font-medium ${dayColor}`}>{t((weekStartsOn === 1 ? WEEKDAY_KEYS_MON : WEEKDAY_KEYS_SUN)[i])}</span>
              <span className={`${dateFontClass} ${dateColor}`}>{format(day, 'd')}</span>
            </button>
          )
        })}
      </div>

      {/* Booking List */}
      <div className="space-y-2">
        {dayBookings.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#6B7280] dark:text-[#6D5A8A]">
            {t('calendarNoEvents')}
          </div>
        ) : (
          <>
            {dayBookings.map(b => {
              const status = getStatusInfo(b)
              return (
                <div key={b.id} className="flex items-center rounded-xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] overflow-hidden">
                  <div className="w-1 self-stretch" style={{ backgroundColor: getAccentColor(b) }} />
                  <div className="flex items-center justify-between flex-1 px-3.5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-bold text-[#1E1E2E] dark:text-[#E8E4F0]">
                        {studentNames[b.student_id] || tc('student')}
                      </span>
                      <span className="text-[13px] text-[#6B7280] dark:text-[#6D5A8A]">
                        {format(new Date(b.start_time), 'HH:mm')} - {format(new Date(b.end_time), 'HH:mm')}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold ${status.text} ${status.bg} rounded-md px-2 py-1`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })}
            <Link
              href="/teacher/calendar"
              className="flex items-center justify-center gap-1 pt-2 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              {t('upcomingLessonsViewAll')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
