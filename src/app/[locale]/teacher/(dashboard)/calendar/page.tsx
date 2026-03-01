"use client"

import { useCallback, useMemo, useState } from 'react'
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
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useShifts } from '@/hooks/use-shifts'
import { useAvailability } from '@/hooks/use-availability'
import { useBookings } from '@/hooks/use-bookings'
import { ShiftForm } from '@/components/calendar/shift-form'
import { useTranslations } from 'next-intl'

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
  const { bookings, loading: bookingsLoading } = useBookings(teacherId, 'teacher')

  // Dialog state
  const [shiftFormOpen, setShiftFormOpen] = useState(false)
  const [shiftFormDate, setShiftFormDate] = useState<Date | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Convert data to FullCalendar events
  const events: EventInput[] = useMemo(() => {
    const result: EventInput[] = []

    // Shifts (purple)
    for (const s of shifts) {
      result.push({
        id: `shift:${s.id}`,
        title: t('eventShift'),
        start: s.start_time,
        end: s.end_time,
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9',
        textColor: '#ffffff',
        extendedProps: { type: 'shift', shiftId: s.id, rrule: s.rrule },
      })
    }

    // Availability (green)
    for (const a of availability) {
      if (a.is_bookable) {
        result.push({
          id: `avail:${a.id}`,
          title: t('eventAvailable'),
          start: a.slot_start,
          end: a.slot_end,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          textColor: '#ffffff',
          extendedProps: { type: 'availability' },
        })
      }
    }

    // Bookings (blue)
    for (const b of bookings) {
      if (b.status !== 'canceled') {
        result.push({
          id: `booking:${b.id}`,
          title: `${tc('statusLabels.' + (b.status === 'confirmed' ? 'confirmed' : b.status === 'done' ? 'done' : 'pending'))}`,
          start: b.start_time,
          end: b.end_time,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          textColor: '#ffffff',
          extendedProps: { type: 'booking' },
        })
      }
    }

    return result
  }, [shifts, availability, bookings, t, tc])

  // Handle date click -> open shift form
  const handleDateClick = useCallback((info: DateClickArg) => {
    setShiftFormDate(info.date)
    setShiftFormOpen(true)
  }, [])

  // Handle event click -> show delete dialog for shifts
  const handleEventClick = useCallback((info: EventClickArg) => {
    const props = info.event.extendedProps
    if (props.type === 'shift') {
      setDeleteConfirm({
        id: props.shiftId,
        title: `${info.event.start?.toLocaleDateString('ja-JP')} ${t('shiftOf')}`,
      })
    }
  }, [t])

  // Handle FullCalendar date range changes
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ start: arg.start, end: arg.end })
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

  const loading = shiftsLoading || availLoading || bookingsLoading

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <Button onClick={() => { setShiftFormDate(undefined); setShiftFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> {t('addShift')}
          </Button>
        </div>

        {shiftsError && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
            {shiftsError}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#7c3aed]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendShift')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendAvailable')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-slate-600 dark:text-slate-400">{t('legendBooking')}</span>
          </div>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-surface-raised/60 rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          )}
          <div className="fc-wrapper bg-white dark:bg-surface-raised rounded-xl border border-slate-200 dark:border-brand-800/20 p-4 shadow-sm">
            <FullCalendar
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={jaLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
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
              <DialogTitle>{t('deleteShiftTitle')}</DialogTitle>
              <DialogDescription>
                {t('deleteShiftDescription', { title: deleteConfirm?.title || '' })}
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
      </div>
    </ProtectedRoute>
  )
}
