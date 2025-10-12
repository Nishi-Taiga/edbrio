'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type BookingRow = {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'canceled' | 'done'
  teacher_id: string
}

type TicketBalanceRow = {
  id: string
  student_id: string
  ticket_id: string
  remaining_minutes: number
  expires_at: string | null
  tickets?: { id: string; name: string; minutes: number } | null
}

export default function GuardianDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upcoming, setUpcoming] = useState<BookingRow[]>([])
  const [balances, setBalances] = useState<TicketBalanceRow[]>([])

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        // fetch guardian's students first
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) {
          // When auth guard is disabled (bypass), skip user-scoped queries
          setUpcoming([])
          setBalances([])
          return
        }

        const { data: students, error: sErr } = await supabase
          .from('students')
          .select('id')
          .eq('guardian_id', uid)
        if (sErr) throw sErr

        const studentIds = (students || []).map((s) => s.id)

        if (studentIds.length > 0) {
          // Upcoming bookings (next 14 days)
          const nowIso = new Date().toISOString()
          const { data: bks, error: bErr } = await supabase
            .from('bookings')
            .select('id,start_time,end_time,status,teacher_id')
            .in('student_id', studentIds)
            .gte('start_time', nowIso)
            .order('start_time', { ascending: true })
            .limit(5)
          if (bErr) throw bErr
          if (mounted) setUpcoming(bks || [])

          // Ticket balances with ticket info
          const { data: tb, error: tErr } = await supabase
            .from('ticket_balances')
            .select('id,student_id,ticket_id,remaining_minutes,expires_at,tickets(id,name,minutes)')
            .in('student_id', studentIds)
            .order('expires_at', { ascending: true })
            .limit(10)
          if (tErr) throw tErr
          if (mounted) setBalances(tb || [])
        } else {
          if (mounted) {
            setUpcoming([])
            setBalances([])
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

  const content = (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600">予約の確認やチケット残高を表示します。</p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">
          データ取得でエラーが発生しました: {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>今後の予約</CardTitle>
            <CardDescription>直近の予定（最大5件）</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : upcoming.length === 0 ? (
              <div className="text-gray-500">予定はありません。</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">
                        {format(new Date(b.start_time), 'PPPp', { locale: ja })}
                        <span className="mx-1">-</span>
                        {format(new Date(b.end_time), 'p', { locale: ja })}
                      </div>
                      <div className="text-xs text-gray-600">講師ID: {b.teacher_id}</div>
                    </div>
                    <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/guardian/booking">
                <Button variant="outline" size="sm">予約する</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>チケット残高</CardTitle>
            <CardDescription>有効期限の近い順</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : balances.length === 0 ? (
              <div className="text-gray-500">チケットがありません。</div>
            ) : (
              <div className="space-y-3">
                {balances.map((t) => (
                  <div key={t.id} className="p-3 border rounded">
                    <div className="font-medium">{t.tickets?.name ?? 'チケット'}</div>
                    <div className="text-sm text-gray-600">
                      残り {t.remaining_minutes} 分
                      {t.expires_at && (
                        <>
                          <span className="mx-1">・</span>
                          有効期限 {format(new Date(t.expires_at), 'PPP', { locale: ja })}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      {content}
    </ProtectedRoute>
  )
}

