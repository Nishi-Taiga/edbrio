"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg, EventClickArg } from '@fullcalendar/interaction'
import type { DatesSetArg, EventInput } from '@fullcalendar/core'
import jaLocale from '@fullcalendar/core/locales/ja'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertTriangle, Check, Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useShifts } from '@/hooks/use-shifts'
import { useAvailability } from '@/hooks/use-availability'
import { useBookings } from '@/hooks/use-bookings'
import { useBookingReports } from '@/hooks/use-booking-reports'
import { useReports } from '@/hooks/use-reports'
import { ShiftForm } from '@/components/calendar/shift-form'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'

type BookingDetail = {
  id: string
  studentName: string
  start: Date
  end: Date
  status: 'pending' | 'confirmed' | 'done'
}

export default function TeacherCalendarPage() {
  const t = useTranslations('teacherCalendar')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const teacherId = user?.id

  // Date range for fetching data (managed by FullCalendar's datesSet)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    return { start, end }
  })

  const { shifts, loading: shiftsLoading, error: shiftsError, createShift, deleteShift } = useShifts(teacherId)
  const { availability, loading: availLoading } = useAvailability(teacherId, dateRange)
  const { bookings, loading: bookingsLoading, updateBookingStatus } = useBookings(teacherId, 'teacher')
  const { reports, resolveReport, refresh: refreshReports } = useBookingReports(teacherId, 'teacher')
  const { reports: lessonReports, loading: reportsLoading } = useReports(teacherId, 'teacher')

  const calendarRef = useRef<FullCalendar>(null)
  const [currentView, setCurrentView] = useState<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek')

  // Dialog state
  const [shiftFormOpen, setShiftFormOpen] = useState(false)
  const [shiftFormDate, setShiftFormDate] = useState<Date | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Booking detail dialog
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null)
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false)
  const [isResolvingReport, setIsResolvingReport] = useState(false)

  // Student name & subject resolution
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [studentSubjects, setStudentSubjects] = useState<Record<string, string>>({})
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (bookings.length === 0) return
    const ids = [...new Set(bookings.map(b => b.student_id))]
    supabase
      .from('student_profiles')
      .select('student_id, name, subjects')
      .in('student_id', ids)
      .then(({ data }) => {
        if (data) {
          const nameMap: Record<string, string> = {}
          const subjectMap: Record<string, string> = {}
          data.forEach((p: { student_id: string | null; name: string; subjects: string[] }) => {
            if (p.student_id) {
              nameMap[p.student_id] = p.name
              if (p.subjects?.length > 0) subjectMap[p.student_id] = p.subjects[0]
            }
          })
          setStudentNames(nameMap)
          setStudentSubjects(subjectMap)
        }
      })
  }, [bookings, supabase])

  // Build a lookup from availability source to shift ID for deletion
  const availToShiftId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of availability) {
      if (a.source?.startsWith('shift:')) {
        map[a.id] = a.source.replace('shift:', '')
      }
    }
    return map
  }, [availability])

  // Lesson report lookup for color coding
  const reportedBookingIds = useMemo(() =>
    new Set(lessonReports.filter(r => r.booking_id).map(r => r.booking_id)),
    [lessonReports]
  )

  // Convert data to FullCalendar events
  const events: EventInput[] = useMemo(() => {
    const result: EventInput[] = []

    // Availability / 空き枠 (lighter green to distinguish from done bookings)
    for (const a of availability) {
      if (a.is_bookable) {
        result.push({
          id: `avail:${a.id}`,
          title: t('eventAvailable'),
          start: a.slot_start,
          end: a.slot_end,
          backgroundColor: '#34d399',
          borderColor: '#10b981',
          textColor: '#ffffff',
          extendedProps: { type: 'availability', availId: a.id },
        })
      }
    }

    // Bookings (color-coded matching dashboard calendar: blue=booked, green=done, red=needs report)
    for (const b of bookings) {
      if (b.status === 'canceled') continue
      const name = studentNames[b.student_id] || ''
      const subject = studentSubjects[b.student_id] || ''
      const title = name && subject ? `${name} · ${subject}` : name || tc('student')

      const isDone = b.status === 'done'
      const hasReport = reportedBookingIds.has(b.id)

      let bgColor: string
      let borderColor: string

      if (isDone && hasReport) {
        bgColor = '#10b981'
        borderColor = '#059669'
      } else if (isDone) {
        bgColor = '#ef4444'
        borderColor = '#dc2626'
      } else {
        bgColor = '#3b82f6'
        borderColor = '#2563eb'
      }

      result.push({
        id: `booking:${b.id}`,
        title,
        start: b.start_time,
        end: b.end_time,
        backgroundColor: bgColor,
        borderColor,
        textColor: '#ffffff',
        extendedProps: { type: 'booking', bookingId: b.id },
      })
    }

    return result
  }, [availability, bookings, studentNames, studentSubjects, reportedBookingIds, t, tc])

  // Handle date click -> open shift form
  const handleDateClick = useCallback((info: DateClickArg) => {
    setShiftFormDate(info.date)
    setShiftFormOpen(true)
  }, [])

  // Handle event click
  const handleEventClick = useCallback((info: EventClickArg) => {
    const props = info.event.extendedProps
    if (props.type === 'availability') {
      const shiftId = availToShiftId[props.availId]
      if (shiftId) {
        setDeleteConfirm({
          id: shiftId,
          title: `${info.event.start?.toLocaleDateString('ja-JP')} ${t('slotOf')}`,
        })
      }
    } else if (props.type === 'booking') {
      const booking = bookings.find(b => b.id === props.bookingId)
      if (booking) {
        setBookingDetail({
          id: booking.id,
          studentName: studentNames[booking.student_id] || booking.student_id,
          start: new Date(booking.start_time),
          end: new Date(booking.end_time),
          status: booking.status as 'pending' | 'confirmed' | 'done',
        })
      }
    }
  }, [t, availToShiftId, bookings, studentNames])

  // Handle FullCalendar date range changes
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ start: arg.start, end: arg.end })
    setCurrentView(arg.view.type as 'timeGridWeek' | 'dayGridMonth')
  }, [])

  // Custom view switching
  const changeView = useCallback((view: 'timeGridWeek' | 'dayGridMonth') => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.changeView(view)
      setCurrentView(view)
    }
  }, [])

  const goToday = useCallback(() => {
    const api = calendarRef.current?.getApi()
    if (api) api.today()
  }, [])

  // Handle shift creation
  const handleCreateShift = async (params: { startTime: string; endTime: string; rrule?: string }) => {
    await createShift(params)
  }

  // Handle shift deletion
  const handleDeleteShift = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteShift(deleteConfirm.id)
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  // Handle booking status update
  const handleBookingStatus = async (status: 'confirmed' | 'canceled') => {
    if (!bookingDetail) return
    setIsUpdatingBooking(true)
    try {
      await updateBookingStatus(bookingDetail.id, status)
      toast.success(status === 'confirmed' ? t('approveSuccess') : t('rejectSuccess'))
      setBookingDetail(null)
    } catch {
      toast.error(tc('updateFailed'))
    } finally {
      setIsUpdatingBooking(false)
    }
  }

  // Handle report resolve (approve/reject)
  const handleReportResolve = async (reportId: string, action: 'approve' | 'reject') => {
    setIsResolvingReport(true)
    try {
      await resolveReport(reportId, action)
      toast.success(action === 'approve' ? t('reportApproveSuccess') : t('reportRejectSuccess'))
      await refreshReports()
    } catch {
      toast.error(tc('updateFailed'))
    } finally {
      setIsResolvingReport(false)
    }
  }

  // Get report for a booking
  const getReportForBooking = useCallback((bookingId: string) => {
    return reports.find(r => r.booking_id === bookingId)
  }, [reports])

  const reportReasonLabel = (reason: string) => {
    switch (reason) {
      case 'late': return t('reportReasonLate')
      case 'absent': return t('reportReasonAbsent')
      case 'other': return t('reportReasonOther')
      default: return reason
    }
  }

  const loading = shiftsLoading || availLoading || bookingsLoading || reportsLoading

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <Button onClick={() => { setShiftFormDate(undefined); setShiftFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> {t('addSlot')}
          </Button>
        </div>

        {shiftsError && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
            {shiftsError}
          </div>
        )}

        {/* Legend (matching dashboard: booked/done/needs-report + availability) */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#34d399]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendAvailable')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendBooking')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10b981]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendDone')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ef4444]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendNeedsReport')}</span>
          </div>
        </div>

        {/* View toggle + Today button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <button
              onClick={() => changeView('timeGridWeek')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'timeGridWeek'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('viewWeek')}
            </button>
            <button
              onClick={() => changeView('dayGridMonth')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'dayGridMonth'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('viewMonth')}
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {t('today')}
          </button>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-surface-raised/60 rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          )}
          <div className="fc-wrapper bg-white dark:bg-surface-raised rounded-xl border border-slate-200 dark:border-brand-800/20 p-2 sm:p-4 shadow-sm">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={jaLocale}
              headerToolbar={{
                left: 'prev',
                center: 'title',
                right: 'next',
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={false}
              nowIndicator={true}
              selectable={false}
              editable={false}
              eventDisplay="block"
            />
          </div>
        </div>

        {/* Shift Form Dialog */}
        <ShiftForm
          open={shiftFormOpen}
          onClose={() => setShiftFormOpen(false)}
          onSubmit={handleCreateShift}
          initialDate={shiftFormDate}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('deleteSlotTitle')}</DialogTitle>
              <DialogDescription>
                {t('deleteSlotDescription', { title: deleteConfirm?.title || '' })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>{tc('cancel')}</Button>
              <Button variant="destructive" onClick={handleDeleteShift} disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-1" />{deleting ? tc('deleting') : tc('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Booking Detail Dialog */}
        <Dialog open={!!bookingDetail} onOpenChange={(o) => { if (!o) setBookingDetail(null) }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('bookingDetailTitle')}</DialogTitle>
            </DialogHeader>
            {bookingDetail && (() => {
              const report = getReportForBooking(bookingDetail.id)
              return (
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{t('bookingStudent', { name: bookingDetail.studentName })}</span>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {format(bookingDetail.start, 'PPP p', { locale: ja })} - {format(bookingDetail.end, 'p', { locale: ja })}
                  </div>
                  <div>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs border ${
                      bookingDetail.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' :
                      bookingDetail.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' :
                      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-surface dark:text-slate-300 dark:border-brand-800/20'
                    }`}>
                      {tc('statusLabels.' + bookingDetail.status)}
                    </span>
                  </div>

                  {/* Report section */}
                  {report && (
                    <div className={`rounded-lg p-3 border ${
                      report.status === 'pending'
                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30'
                        : report.status === 'approved' || report.status === 'auto_approved'
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium">{t('reportSection')}</span>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">{reportReasonLabel(report.reason)}</span>
                        {report.description && (
                          <p className="mt-1 text-slate-600 dark:text-slate-400">{report.description}</p>
                        )}
                      </div>

                      {report.status === 'pending' && (
                        <>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{t('reportDeadlineNote')}</p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportResolve(report.id, 'reject')}
                              disabled={isResolvingReport}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> {t('reportRejectButton')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReportResolve(report.id, 'approve')}
                              disabled={isResolvingReport}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> {t('reportApproveButton')}
                            </Button>
                          </div>
                        </>
                      )}
                      {(report.status === 'approved' || report.status === 'auto_approved') && (
                        <span className="inline-block mt-2 rounded px-2 py-0.5 text-xs border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30">
                          {report.status === 'auto_approved' ? t('reportStatusAutoApproved') : t('reportStatusApproved')}
                        </span>
                      )}
                      {report.status === 'rejected' && (
                        <span className="inline-block mt-2 rounded px-2 py-0.5 text-xs border bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30">
                          {t('reportStatusRejected')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
            {bookingDetail?.status === 'pending' && (
              <DialogFooter>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleBookingStatus('canceled')}
                  disabled={isUpdatingBooking}
                >
                  <X className="w-4 h-4 mr-1" /> {t('rejectButton')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBookingStatus('confirmed')}
                  disabled={isUpdatingBooking}
                >
                  <Check className="w-4 h-4 mr-1" /> {t('approveButton')}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
