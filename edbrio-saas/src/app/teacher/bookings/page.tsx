"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type BookingRow = { id: string; start_time: string; end_time: string; status: 'pending'|'confirmed'|'canceled'|'done'; student_id: string }

export default function TeacherBookingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<BookingRow[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null); setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setItems([]); return }
        const { data, error } = await supabase
          .from('bookings')
          .select('id,start_time,end_time,status,student_id')
          .eq('teacher_id', uid)
          .order('start_time', { ascending: false })
          .limit(200)
        if (error) throw error
        if (mounted) setItems(data || [])
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load(); return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">予約一覧</h1>
        {error && (<div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">{error}</div>)}
        {loading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">予約はありません。</div>
        ) : (
          <div className="space-y-3">
            {items.map((b) => (
              <Card key={b.id}>
                <CardHeader><CardTitle className="text-sm">生徒ID: {b.student_id}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    {format(new Date(b.start_time), 'PPP p', { locale: ja })} - {format(new Date(b.end_time), 'p', { locale: ja })}
                    <span className="ml-2 inline-block rounded px-2 py-0.5 text-xs border">{b.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

