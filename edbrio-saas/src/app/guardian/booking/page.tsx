"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, MapPin, Check } from 'lucide-react'
import { format, addDays, isSameDay, startOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

type AvailabilityRow = {
  id: string
  teacher_id: string
  slot_start: string
  slot_end: string
  is_bookable: boolean
}

type TeacherRow = {
  id: string
  handle: string
  subjects: string[]
  grades: string[]
}

type TicketBalanceRow = {
  id: string
  student_id: string
  ticket_id: string
  remaining_minutes: number
  expires_at: string | null
  tickets?: { id: string; name: string } | null
}

export default function BookingPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityRow | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [avail, setAvail] = useState<AvailabilityRow[]>([])
  const [tickets, setTickets] = useState<TicketBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        if (process.env.NEXT_PUBLIC_DISABLE_DATA_FETCH === 'true') {
          if (mounted) {
            setTeachers([])
            setAvail([])
            setTickets([])
            setLoading(false)
          }
          return
        }

        const { data: ts, error: tErr } = await supabase
          .from('teachers')
          .select('id,handle,subjects,grades')
          .limit(100)
        if (tErr) throw tErr
        if (mounted) setTeachers(ts || [])

        const start = new Date()
        const end = addDays(start, 7)
        const { data: av, error: aErr } = await supabase
          .from('availability')
          .select('id,teacher_id,slot_start,slot_end,is_bookable')
          .gte('slot_start', start.toISOString())
          .lte('slot_start', end.toISOString())
          .eq('is_bookable', true)
          .order('slot_start', { ascending: true })
        if (aErr) throw aErr
        if (mounted) setAvail(av || [])

        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (uid) {
          const { data: students, error: sErr } = await supabase
            .from('students')
            .select('id')
            .eq('guardian_id', uid)
          if (sErr) throw sErr
          const studentIds = (students || []).map((s) => s.id)
          if (studentIds.length > 0) {
            const { data: tb, error: tbErr } = await supabase
              .from('ticket_balances')
              .select('id,student_id,ticket_id,remaining_minutes,expires_at')
              .in('student_id', studentIds)
              .order('expires_at', { ascending: true })
            if (tbErr) throw tbErr
            if (mounted) setTickets(tb || [])
          }
        }
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [supabase])

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filtered = avail.filter((s) => selectedTeacher === 'all' || s.teacher_id === selectedTeacher)
  const getSlotsForDate = (date: Date) => filtered.filter((s) => isSameDay(new Date(s.slot_start), date))

  const getAvailableTickets = () => tickets

  const handleBookSlot = async () => {
    if (!selectedSlot || !selectedTicket) return
    console.log('Booking request:', {
      slotId: selectedSlot.id,
      teacherId: selectedSlot.teacher_id,
      ticketBalanceId: selectedTicket,
      start: selectedSlot.slot_start,
      end: selectedSlot.slot_end,
    })
    setShowConfirmation(true)
  }

  const resetBooking = () => {
    setSelectedSlot(null)
    setSelectedTicket('')
    setShowConfirmation(false)
  }

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">予約</h1>
          <p className="text-gray-600">先生の空き時間から予約してください</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">
            データ取得でエラーが発生しました: {error}
          </div>
        )}

        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">先生を絞り込み</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="先生を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての先生</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.handle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>今週に戻る</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((date) => (
            <Card key={date.toISOString()}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {format(date, 'M月d日(E)', { locale: ja })}
                </CardTitle>
                <CardDescription>空き枠</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-gray-500">読み込み中...</div>
                ) : (
                  <div className="space-y-2">
                    {getSlotsForDate(date).map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">講師ID: {slot.teacher_id}</div>
                          </div>
                          <div className="text-sm">
                            {format(new Date(slot.slot_start), 'HH:mm', { locale: ja })}
                            <span className="mx-1">-</span>
                            {format(new Date(slot.slot_end), 'HH:mm', { locale: ja })}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-1" />オンライン</span>
                          <span className="mx-2">•</span>
                          <span className="inline-flex items-center"><Clock className="w-3 h-3 mr-1" />
                            {Math.max(0, Math.round((new Date(slot.slot_end).getTime() - new Date(slot.slot_start).getTime()) / 60000))}分
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>予約内容の確認</DialogTitle>
              <DialogDescription>
                {selectedSlot && (
                  <div className="mt-2 text-sm text-gray-700">
                    <div>講師ID: {selectedSlot.teacher_id}</div>
                    <div className="mt-1">
                      日時: {format(new Date(selectedSlot.slot_start), 'M月d日(E) HH:mm', { locale: ja })}
                      {' - '}
                      {format(new Date(selectedSlot.slot_end), 'HH:mm', { locale: ja })}
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedSlot && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">チケットを選択</label>
                  <Select value={selectedTicket} onValueChange={setSelectedTicket}>
                    <SelectTrigger>
                      <SelectValue placeholder="チケットを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTickets().map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.ticket_id}（残り{t.remaining_minutes}分{t.expires_at ? `、期限: ${format(new Date(t.expires_at), 'PPP', { locale: ja })}` : ''}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetBooking}>キャンセル</Button>
                  <Button onClick={handleBookSlot} disabled={!selectedTicket}>
                    <Check className="w-4 h-4 mr-1" /> 予約確定
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
