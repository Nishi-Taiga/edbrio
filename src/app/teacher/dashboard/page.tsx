"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, DollarSign, FileText, Settings, Users } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useTickets } from '@/hooks/use-tickets'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Booking, Ticket, Payment } from '@/lib/types/database'


export default function TeacherDashboard() {
  const { user, dbUser, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings(user?.id, 'teacher')
  const { tickets: activeTickets, loading: ticketsLoading } = useTickets(user?.id, 'teacher')
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [revenueLoading, setRevenueLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user?.id || dbUser?.role !== 'teacher') return

    async function fetchRevenue() {
      setRevenueLoading(true)
      const start = new Date()
      start.setDate(1)
      const { data: pays } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('teacher_id', user!.id)
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())

      const rev = ((pays || []) as Payment[]).reduce((acc: number, p: Payment) => acc + (p.amount_cents || 0), 0)
      setMonthRevenue(rev)
      setRevenueLoading(false)
    }
    fetchRevenue()
  }, [user, dbUser, supabase])

  const upcoming = useMemo(() => bookings.filter((b: Booking) => b.status === 'confirmed').slice(0, 5), [bookings])
  const activeTicketCount = useMemo(() => activeTickets.filter((t: Ticket) => t.is_active).length, [activeTickets])
  const studentCount = useMemo(() => new Set(bookings.map((b: Booking) => b.student_id)).size, [bookings])

  const loading = authLoading || bookingsLoading || ticketsLoading || revenueLoading
  const error = null

  const formatYen = (cents: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((cents || 0) / 100)

  const quickActions = [
    { title: '生徒カルテ', description: '生徒情報と学習進捗', href: '/teacher/students', icon: Users },
    { title: 'カレンダー管理', description: 'シフトと空き時間を設定', href: '/teacher/calendar', icon: Calendar },
    { title: 'チケット管理', description: '販売と有効期限を設定', href: '/teacher/tickets', icon: DollarSign },
    { title: 'レポート作成', description: '授業のレポートを作成', href: '/teacher/reports', icon: FileText },
    { title: 'プロフィール設定', description: '公開情報の設定', href: '/teacher/profile', icon: Settings },
  ]

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
          <p className="text-gray-600">予約とチケット、売上の概要</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">
            データ取得でエラーが発生しました: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">今月の売上</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatYen(monthRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">アクティブ生徒</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{studentCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">公開中チケット</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeTicketCount}</div></CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>直近の予約</CardTitle>
                <CardDescription>これからの予定</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-gray-500">読み込み中...</div>
                ) : upcoming.length === 0 ? (
                  <div className="text-gray-500">予定はありません。</div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((b: Booking) => (
                      <div key={b.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {format(new Date(b.start_time), 'PPPp', { locale: ja })}
                            <span className="mx-1">-</span>
                            {format(new Date(b.end_time), 'p', { locale: ja })}
                          </div>
                          <div className="text-xs text-gray-600">生徒ID: {b.student_id}</div>
                        </div>
                        <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
                <CardDescription>よく使う操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((a) => {
                    const Icon = a.icon
                    return (
                      <Link key={a.title} href={a.href}>
                        <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                          <Icon className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-sm">{a.title}</div>
                            <div className="text-xs text-gray-600">{a.description}</div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

