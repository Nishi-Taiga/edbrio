"use client"

import { useState, useCallback } from 'react'
import { Booking } from '@/lib/types/database'
import { TeacherDashboardCalendar, type CalendarEvent } from '@/components/dashboard/teacher-calendar'
import { MobileCalendarCard } from './mobile-calendar-card'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface ResponsiveCalendarProps {
  // For desktop calendar
  calendarEvents: CalendarEvent[]
  loading: boolean
  // For mobile calendar
  bookings: Booking[]
  reportedBookingIds: Set<string | null>
  studentNames: Record<string, string>
  weekStartsOn?: 0 | 1
}

const STATUS_LABELS: Record<string, { ja: string; color: string }> = {
  confirmed: { ja: '確定', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  pending: { ja: '確認待ち', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  done: { ja: '完了', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  canceled: { ja: 'キャンセル', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}

export function ResponsiveCalendar({
  calendarEvents,
  loading,
  bookings,
  reportedBookingIds,
  studentNames,
  weekStartsOn = 0,
}: ResponsiveCalendarProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const handleEventClick = useCallback((eventId: string) => {
    const booking = bookings.find(b => b.id === eventId)
    if (booking) setSelectedBooking(booking)
  }, [bookings])

  const status = selectedBooking ? STATUS_LABELS[selectedBooking.status] : null

  return (
    <>
      {/* Mobile: date picker + list */}
      <div className="md:hidden">
        <MobileCalendarCard
          bookings={bookings}
          reportedBookingIds={reportedBookingIds}
          studentNames={studentNames}
          loading={loading}
          weekStartsOn={weekStartsOn}
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
            onEventClick={handleEventClick}
            weekStartsOn={weekStartsOn}
          />
        )}
      </div>

      {/* Lesson Detail Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={open => { if (!open) setSelectedBooking(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('lessonDetailTitle') || '授業詳細'}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('lessonDetailTitle') || '授業詳細'}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Student name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#D4BEE4] flex items-center justify-center text-white font-bold text-sm">
                  {(studentNames[selectedBooking.student_id] || tc('student'))[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#E8E4F0]">
                    {studentNames[selectedBooking.student_id] || tc('student')}
                  </p>
                  {status && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.ja}
                    </span>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-gray-50 dark:bg-[#282237] rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-[#9CA3AF] w-12 shrink-0">日付</span>
                  <span className="font-medium text-gray-900 dark:text-[#E8E4F0]">
                    {format(new Date(selectedBooking.start_time), 'yyyy年M月d日（E）', { locale: ja })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-[#9CA3AF] w-12 shrink-0">時間</span>
                  <span className="font-medium text-gray-900 dark:text-[#E8E4F0]">
                    {format(new Date(selectedBooking.start_time), 'HH:mm')} – {format(new Date(selectedBooking.end_time), 'HH:mm')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-gray-50 dark:bg-[#282237] rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-1">メモ</p>
                  <p className="text-sm text-gray-900 dark:text-[#E8E4F0] whitespace-pre-wrap">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}

              {/* Report status */}
              {selectedBooking.status === 'done' && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-[#9CA3AF]">レポート:</span>
                  {reportedBookingIds.has(selectedBooking.id) ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">提出済み</span>
                  ) : (
                    <span className="text-red-500 dark:text-red-400 font-medium">未提出</span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
