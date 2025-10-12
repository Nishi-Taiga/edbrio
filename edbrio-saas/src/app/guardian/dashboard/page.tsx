"use client"

import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, CreditCard, FileText, UserPlus, ShoppingCart } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type BookingRow = { id: string; start_time: string; end_time: string; status: 'pending'|'confirmed'|'canceled'|'done'; teacher_id: string }
type ReportRow = { id: string; booking_id: string; published_at: string | null; content_public: string | null }

export default function GuardianHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState([
    { title: '次の予約', value: '-', description: '-', icon: Clock, color: 'text-blue-600' },
    { title: '保有チケット', value: '-', description: '-', icon: CreditCard, color: 'text-green-600' },
    { title: '新着レポート', value: '-', description: '-', icon: FileText, color: 'text-purple-600' },
    { title: '担当中の先生', value: '-', description: '-', icon: UserPlus, color: 'text-orange-600' },
  ])
  const [upcoming, setUpcoming] = useState<BookingRow[]>([])
  const [recentReports, setRecentReports] = useState<ReportRow[]>([])

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id

        if (!uid) {
          if (mounted) {
            setUpcoming([])
            setRecentReports([])
          }
          return
        }

        const { data: students, error: sErr } = await supabase
          .from('students')
          .select('id')
          .eq('guardian_id', uid)
        if (sErr) throw sErr
        const studentIds = (students || []).map(s => s.id)

        let nextVal = '-', nextDesc = '-'
        if (studentIds.length > 0) {
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
          if (bks && bks[0]) {
            nextVal = format(new Date(bks[0].start_time), 'PPP p', { locale: ja })
            nextDesc = `講師ID: ${bks[0].teacher_id}`
          }
        }

        let balanceValue = '-', balanceDesc = '-'
        if (studentIds.length > 0) {
          const { data: tbs, error: tErr } = await supabase
            .from('ticket_balances')
            .select('remaining_minutes,expires_at')
            .in('student_id', studentIds)
          if (tErr) throw tErr
          const totalMin = (tbs || []).reduce((a, b) => a + (b.remaining_minutes || 0), 0)
          const nearest = (tbs || [])
            .filter(tb => tb.expires_at)
            .sort((a,b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())[0]
          balanceValue = `${totalMin}分`
          balanceDesc = nearest?.expires_at ? `最短期限: ${format(new Date(nearest.expires_at), 'PPP', { locale: ja })}` : '-'
        }

        let newReportsCount = '-', newReportsDesc = '-'
        if (studentIds.length > 0) {
          const since = new Date(); since.setDate(since.getDate() - 14)
          const { data: rb, error: rbErr } = await supabase
            .from('bookings')
            .select('id')
            .in('student_id', studentIds)
            .gte('end_time', since.toISOString())
            .order('end_time', { ascending: false })
            .limit(25)
          if (rbErr) throw rbErr
          const bIds = (rb || []).map(b => b.id)
          if (bIds.length > 0) {
            const { data: reps, error: rErr } = await supabase
              .from('reports')
              .select('id,booking_id,published_at,content_public')
              .in('booking_id', bIds)
              .order('published_at', { ascending: false })
              .limit(10)
            if (rErr) throw rErr
            if (mounted) setRecentReports(reps || [])
            newReportsCount = String((reps || []).length)
            newReportsDesc = '最近の公開レポート'
          } else {
            if (mounted) setRecentReports([])
          }
        }

        let teachersVal = '-', teachersDesc = '-'
        if (studentIds.length > 0) {
          const { data: tsRel, error: tsErr } = await supabase
            .from('teacher_students')
            .select('teacher_id,student_id')
            .in('student_id', studentIds)
          if (tsErr) throw tsErr
          const uniqueTeachers = new Set((tsRel || []).map(r => r.teacher_id))
          teachersVal = `${uniqueTeachers.size}人`
          teachersDesc = '-'
        }

        if (mounted) {
          setStats([
            { title: '次の予約', value: nextVal, description: nextDesc, icon: Clock, color: 'text-blue-600' },
            { title: '保有チケット', value: balanceValue, description: balanceDesc, icon: CreditCard, color: 'text-green-600' },
            { title: '新着レポート', value: newReportsCount, description: newReportsDesc, icon: FileText, color: 'text-purple-600' },
            { title: '担当中の先生', value: teachersVal, description: teachersDesc, icon: UserPlus, color: 'text-orange-600' },
          ])
        }
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ホーム</h1>
          <p className="text-gray-600">ご家庭の学習状況を確認しましょう</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">
            データ取得でエラーが発生しました: {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { title: '新規予約', description: '先生の空き時間から予約', href: '/guardian/booking', icon: Calendar, isPrimary: true },
            { title: 'チケット購入', description: '授業で使うチケット', href: '/guardian/tickets', icon: ShoppingCart, isPrimary: false },
            { title: '予約履歴', description: '過去と今後の予約確認', href: '/guardian/bookings', icon: Clock, isPrimary: false },
            { title: 'レポート', description: '授業レポートの確認', href: '/guardian/reports', icon: FileText, isPrimary: false },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className={`cursor-pointer transition-all hover:shadow-md ${action.isPrimary ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <CardContent className="flex items-center p-6">
                    <Icon className={`h-8 w-8 mr-4 ${action.isPrimary ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div>
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>直近の予約</CardTitle>
              <CardDescription>予定されている授業一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {format(new Date(b.start_time), 'PPP p', { locale: ja })}
                        <span className="mx-1">-</span>
                        {format(new Date(b.end_time), 'p', { locale: ja })}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">講師ID: {b.teacher_id}</div>
                    </div>
                    <div>
                      {b.status === 'confirmed' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">確定</Badge>
                      ) : (
                        <Badge variant="secondary">確認待ち</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <div className="text-gray-500">予定はありません。</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>最近のレポート</CardTitle>
              <CardDescription>新しい授業レポート</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((r) => (
                  <div key={r.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">レポート</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {r.published_at ? format(new Date(r.published_at), 'PPP', { locale: ja }) : '-'}
                    </div>
                    {r.content_public && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{r.content_public}</p>
                    )}
                  </div>
                ))}
                {recentReports.length === 0 && (
                  <div className="text-gray-500">新しいレポートはありません。</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </ProtectedRoute>
  )
}

