"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type ReportRow = {
  id: string
  booking_id: string
  published_at: string | null
  content_public: string | null
}

export default function GuardianReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ReportRow[]>([])

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setItems([]); return }

        const { data: students, error: sErr } = await supabase
          .from('students')
          .select('id')
          .eq('guardian_id', uid)
        if (sErr) throw sErr
        const studentIds = (students || []).map(s => s.id)
        if (studentIds.length === 0) { setItems([]); return }

        // bookings for students
        const { data: bookings, error: bErr } = await supabase
          .from('bookings')
          .select('id')
          .in('student_id', studentIds)
          .order('start_time', { ascending: false })
          .limit(200)
        if (bErr) throw bErr
        const bookingIds = (bookings || []).map(b => b.id)
        if (bookingIds.length === 0) { setItems([]); return }

        const { data: reps, error: rErr } = await supabase
          .from('reports')
          .select('id,booking_id,published_at,content_public')
          .in('booking_id', bookingIds)
          .order('published_at', { ascending: false })
          .limit(100)
        if (rErr) throw rErr
        if (mounted) setItems(reps || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">レポート</h1>
        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">レポートはありません。</div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{r.published_at ? format(new Date(r.published_at), 'PPP', { locale: ja }) : '未公開'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 line-clamp-3">{r.content_public ?? '（内容なし）'}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

