"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, isSameDay, startOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { LoadingButton } from '@/components/ui/loading-button'

type AvailabilityRow = {
  id: string
  teacher_id: string
  slot_start: string
  slot_end: string
  is_bookable: boolean
}

type TeacherInfo = {
  id: string
  display_name: string
}

type TicketBalanceRow = {
  id: string
  student_id: string
  ticket_id: string
  remaining_minutes: number
  expires_at: string | null
}

export default function BookingPage() {
  const t = useTranslations('guardianBooking')
  const tc = useTranslations('common')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityRow | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [teachers, setTeachers] = useState<TeacherInfo[]>([])
  const [avail, setAvail] = useState<AvailabilityRow[]>([])
  const [tickets, setTickets] = useState<TicketBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { createBooking } = useBookings(user?.id, 'guardian')

  const supabase = useMemo(() => createClient(), [])

  // Fetch assigned teachers & tickets (once)
  useEffect(() => {
    let mounted = true
    async function loadBase() {
      try {
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) return

        // Fetch guardian's students
        const { data: students, error: sErr } = await supabase
          .from('students')
          .select('id')
          .eq('guardian_id', uid)
        if (sErr) throw sErr
        const studentIds = (students || []).map(s => s.id)

        if (studentIds.length > 0) {
          // Fetch assigned teacher IDs via teacher_students
          const { data: tsRows, error: tsErr } = await supabase
            .from('teacher_students')
            .select('teacher_id')
            .in('student_id', studentIds)
          if (tsErr) throw tsErr
          const teacherIds = [...new Set((tsRows || []).map(r => r.teacher_id))]

          if (teacherIds.length > 0) {
            // Fetch display names from users table
            const { data: users } = await supabase
              .from('users')
              .select('id, name')
              .in('id', teacherIds)
            const nameMap = new Map((users || []).map(u => [u.id, u.name]))
            const teacherInfos = teacherIds.map(id => ({
              id,
              display_name: nameMap.get(id) || tc('teacher'),
            }))
            if (mounted) {
              setTeachers(teacherInfos)
              if (teacherInfos.length === 1) {
                setSelectedTeacher(teacherInfos[0].id)
              }
            }
          }

          // Fetch ticket balances
          const { data: tb, error: tbErr } = await supabase
            .from('ticket_balances')
            .select('id,student_id,ticket_id,remaining_minutes,expires_at')
            .in('student_id', studentIds)
            .order('expires_at', { ascending: true })
          if (tbErr) throw tbErr
          if (mounted) setTickets(tb || [])
        }
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      }
    }
    loadBase()
    return () => { mounted = false }
  }, [supabase])

  // Fetch availability for the current week (only assigned teachers)
  useEffect(() => {
    let mounted = true
    async function loadAvail() {
      if (teachers.length === 0) {
        setLoading(false)
        setAvail([])
        return
      }
      try {
        setLoading(true)
        setError(null)
        const weekEnd = addDays(currentWeek, 7)
        const teacherIds = teachers.map(tr => tr.id)
        const { data: av, error: aErr } = await supabase
          .from('availability')
          .select('id,teacher_id,slot_start,slot_end,is_bookable')
          .in('teacher_id', teacherIds)
          .gte('slot_start', currentWeek.toISOString())
          .lt('slot_start', weekEnd.toISOString())
          .eq('is_bookable', true)
          .order('slot_start', { ascending: true })
          .limit(500)
        if (aErr) throw aErr
        if (mounted) setAvail(av || [])
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAvail()
    return () => { mounted = false }
  }, [supabase, currentWeek, teachers])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))

  const filtered = avail.filter(s => selectedTeacher === 'all' || s.teacher_id === selectedTeacher)
  const getSlotsForDate = (date: Date) => filtered.filter(s => isSameDay(new Date(s.slot_start), date))

  const getTeacherName = (id: string) => {
    const teacher = teachers.find(tr => tr.id === id)
    return teacher?.display_name || tc('teacher')
  }

  const handleBookSlot = async () => {
    if (!selectedSlot || !selectedTicket || !user) return
    setIsSubmitting(true)
    try {
      await createBooking({
        teacher_id: selectedSlot.teacher_id,
        student_id: tickets.find(tk => tk.id === selectedTicket)?.student_id || '',
        start_time: selectedSlot.slot_start,
        end_time: selectedSlot.slot_end,
        status: 'pending',
        ticket_balance_id: selectedTicket,
      }, selectedSlot.id)
      setShowConfirmation(true)
    } catch (err: unknown) {
      console.error('Booking failed:', err)
      toast.error(t('bookingFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetBooking = () => {
    setSelectedSlot(null)
    setSelectedTicket('')
    setShowConfirmation(false)
    if (showConfirmation) {
      router.push('/guardian/dashboard')
    }
  }

  const isToday = (date: Date) => isSameDay(date, new Date())
  const isPast = (date: Date) => date < new Date() && !isToday(date)

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('description')}</p>
        </div>

        {error && <ErrorAlert message={error} />}

        {!loading && teachers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">{t('noTeachers')}</p>
            </CardContent>
          </Card>
        ) : (<>

        {/* Filters & Week Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {teachers.length > 1 && (
            <div className="w-full sm:w-64">
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder={t('teacherFilterPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacherFilterAll')}</SelectItem>
                  {teachers.map(tr => (
                    <SelectItem key={tr.id} value={tr.id}>{tr.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[140px] text-center">
              {format(currentWeek, 'M月d日', { locale: ja })} - {format(addDays(currentWeek, 6), 'M月d日', { locale: ja })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              {t('thisWeek')}
            </Button>
          </div>
        </div>

        {/* Weekly Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map(date => {
            const slots = getSlotsForDate(date)
            const past = isPast(date)
            const today = isToday(date)

            return (
              <Card
                key={date.toISOString()}
                className={`${today ? 'border-brand-500 dark:border-brand-400' : ''} ${past ? 'opacity-50' : ''}`}
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className={`text-sm font-bold ${today ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {format(date, 'M/d(E)', { locale: ja })}
                    {today && <span className="ml-1 text-xs font-normal text-brand-500">{t('today')}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {loading ? (
                    <div className="text-xs text-slate-400">...</div>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">{t('noSlots')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {slots.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => !past && setSelectedSlot(slot)}
                          disabled={past}
                          className="w-full text-left p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <Clock className="w-3 h-3" />
                            {format(new Date(slot.slot_start), 'HH:mm')} - {format(new Date(slot.slot_end), 'HH:mm')}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {getTeacherName(slot.teacher_id)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        </>)}

        {/* Booking Dialog */}
        <Dialog open={!!selectedSlot && !showConfirmation} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirmTitle')}</DialogTitle>
              <DialogDescription>
                {selectedSlot && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-bold">{getTeacherName(selectedSlot.teacher_id)}</span> {t('teacherSuffix')}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {format(new Date(selectedSlot.slot_start), 'M月d日(E) HH:mm', { locale: ja })}
                      {' - '}
                      {format(new Date(selectedSlot.slot_end), 'HH:mm', { locale: ja })}
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedSlot && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('selectTicket')}</label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectTicketPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {tickets.map(tk => (
                        <SelectItem key={tk.id} value={tk.id}>
                          {t('remainingMinutes', { minutes: tk.remaining_minutes })}
                          {tk.expires_at && ` ${t('expiryDate', { date: format(new Date(tk.expires_at), 'M/d', { locale: ja }) })}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetBooking}>{tc('cancel')}</Button>
                  <LoadingButton onClick={handleBookSlot} disabled={!selectedTicket} loading={isSubmitting}>
                    <Check className="w-4 h-4 mr-1" /> {t('confirmButton')}
                  </LoadingButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={resetBooking}>
          <DialogContent>
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('bookingComplete')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('bookingCompleteDescription')}</p>
              <Button className="mt-6" onClick={resetBooking}>{t('goToDashboard')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
