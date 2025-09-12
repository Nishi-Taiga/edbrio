'use client'

import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Calendar, Clock, Users, DollarSign, FileText, Settings } from 'lucide-react'

export default function TeacherDashboard() {
  const { dbUser } = useAuth()

  const stats = [
    {
      title: '今日の予定',
      value: '3件',
      description: '次の授業は14:00から',
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: '未提出レポート',
      value: '2件',
      description: '提出期限が近い',
      icon: FileText,
      color: 'text-orange-600',
    },
    {
      title: '今月の収益',
      value: '¥45,000',
      description: '先月比 +12%',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: '生徒数',
      value: '8人',
      description: 'アクティブな生徒',
      icon: Users,
      color: 'text-purple-600',
    },
  ]

  const recentBookings = [
    {
      id: 1,
      studentName: '田中花子',
      subject: '数学',
      date: '2024-09-12',
      time: '14:00-15:00',
      status: 'confirmed' as const,
    },
    {
      id: 2,
      studentName: '佐藤太郎',
      subject: '英語',
      date: '2024-09-12',
      time: '16:00-17:00',
      status: 'confirmed' as const,
    },
    {
      id: 3,
      studentName: '鈴木美咲',
      subject: '国語',
      date: '2024-09-13',
      time: '10:00-11:00',
      status: 'pending' as const,
    },
  ]

  const quickActions = [
    {
      title: 'カレンダー管理',
      description: 'シフトと空き時間を設定',
      href: '/teacher/calendar',
      icon: Calendar,
    },
    {
      title: 'チケット管理',
      description: '価格と有効期限を設定',
      href: '/teacher/tickets',
      icon: DollarSign,
    },
    {
      title: 'レポート作成',
      description: '授業の報告書を作成',
      href: '/teacher/reports',
      icon: FileText,
    },
    {
      title: 'プロフィール設定',
      description: '公開情報を編集',
      href: '/teacher/profile',
      icon: Settings,
    },
  ]

  const getStatusBadge = (status: 'confirmed' | 'pending') => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800">確定</Badge>
      case 'pending':
        return <Badge variant="secondary">承認待ち</Badge>
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            おかえりなさい、{dbUser?.name}さん
          </h1>
          <p className="text-gray-600">今日も生徒たちの学習をサポートしましょう！</p>
        </div>

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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>最近の予約</CardTitle>
                <CardDescription>直近の授業予約一覧</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{booking.studentName}</div>
                          <Badge variant="outline">{booking.subject}</Badge>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {booking.date} {booking.time}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/teacher/bookings">
                    <Button variant="outline">すべての予約を見る</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
                <CardDescription>よく使う機能へのショートカット</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link key={action.title} href={action.href}>
                        <div className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                          <Icon className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-sm">{action.title}</div>
                            <div className="text-xs text-gray-600">{action.description}</div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Profile Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">プロフィール状況</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">基本情報</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">科目設定</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">チケット作成</span>
                    <Badge variant="secondary">未設定</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stripe連携</span>
                    <Badge variant="secondary">未設定</Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/teacher/profile">
                    <Button size="sm" className="w-full">
                      プロフィールを完成させる
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}