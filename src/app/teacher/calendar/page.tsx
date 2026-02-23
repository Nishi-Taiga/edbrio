"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type ShiftRow = { id: string; start_time: string; end_time: string; rrule: string | null; is_published: boolean | null }
type AvailabilityRow = { id: string; slot_start: string; slot_end: string; is_bookable: boolean }

export default function TeacherCalendarPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shifts, setShifts] = useState<ShiftRow[]>([])
  const [avail, setAvail] = useState<AvailabilityRow[]>([])

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null); setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setShifts([]); setAvail([]); return }
        const { data: s, error: sErr } = await supabase
          .from('shifts')
          .select('id,start_time,end_time,rrule,is_published')
          .eq('teacher_id', uid)
          .order('start_time', { ascending: true })
          .limit(100)
        if (sErr) throw sErr
        const start = new Date(); const end = new Date(); end.setDate(end.getDate() + 14)
        const { data: a, error: aErr } = await supabase
          .from('availability')
          .select('id,slot_start,slot_end,is_bookable')
          .eq('teacher_id', uid)
          .gte('slot_start', start.toISOString())
          .lte('slot_start', end.toISOString())
          .order('slot_start', { ascending: true })
          .limit(200)
        if (aErr) throw aErr
        if (mounted) { setShifts(s || []); setAvail(a || []) }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load(); return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>シフト</CardTitle>
            <CardDescription>登録済みのシフト</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}
            {loading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : shifts.length === 0 ? (
              <div className="text-gray-500">シフトはありません。</div>
            ) : (
              <ul className="text-sm text-gray-700 space-y-1">
                {shifts.map(s => (
                  <li key={s.id} className="border rounded p-2">
                    {format(new Date(s.start_time), 'PPP p', { locale: ja })} - {format(new Date(s.end_time), 'p', { locale: ja })}
                    {s.rrule && <span className="ml-2 text-xs text-gray-500">RRULE: {s.rrule}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>空き枠（2週間）</CardTitle>
            <CardDescription>予約可能な時間帯</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : avail.length === 0 ? (
              <div className="text-gray-500">空き枠はありません。</div>
            ) : (
              <ul className="text-sm text-gray-700 space-y-1">
                {avail.map(a => (
                  <li key={a.id} className="border rounded p-2">
                    {format(new Date(a.slot_start), 'PPP p', { locale: ja })} - {format(new Date(a.slot_end), 'p', { locale: ja })}
                    <span className="ml-2 text-xs border rounded px-2 py-0.5">{a.is_bookable ? '予約可' : '予約不可'}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

