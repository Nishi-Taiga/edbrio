'use client'

import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Calendar, Clock, CreditCard, FileText, UserPlus, ShoppingCart } from 'lucide-react'

export default function GuardianHome() {
  const { dbUser } = useAuth()

  const stats = [
    {
      title: '次の授業',
      value: '今日 14:00',
      description: '田中先生（数学）',
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: '残りチケット',
      value: '12枚',
      description: '有効期限: 2024年11月30日',
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      title: '新着レポート',
      value: '2件',
      description: '未読の学習レポート',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: '受講中の講師',
      value: '3名',
      description: '数学、英語、国語',
      icon: UserPlus,
      color: 'text-orange-600',
    },
  ]

  const upcomingBookings = [
    {
      id: 1,
      teacherName: '田中一郎',
      subject: '数学',
      date: '2024-09-12',
      time: '14:00-15:00',
      status: 'confirmed' as const,
    },
    {
      id: 2,
      teacherName: '佐藤花子',
      subject: '英語',
      date: '2024-09-13',
      time: '16:00-17:00',
      status: 'confirmed' as const,
    },
    {
      id: 3,
      teacherName: '鈴木健太',
      subject: '国語',
      date: '2024-09-14',
      time: '10:00-11:00',
      status: 'pending' as const,
    },
  ]

  const recentReports = [
    {
      id: 1,
      teacherName: '田中一郎',
      subject: '数学',
      title: '二次関数の応用問題',
      date: '2024-09-10',
      isRead: false,
    },
    {
      id: 2,
      teacherName: '佐藤花子',
      subject: '英語',
      title: '英文法 - 現在完了形',
      date: '2024-09-09',
      isRead: true,
    },
  ]

  const quickActions = [
    {
      title: '新規予約',
      description: '講師の空き時間から予約',
      href: '/guardian/booking',
      icon: Calendar,
      isPrimary: true,
    },
    {
      title: 'チケット購入',
      description: '授業で使用するチケット',
      href: '/guardian/tickets',
      icon: ShoppingCart,
      isPrimary: false,
    },
    {
      title: '予約履歴',
      description: '過去・未来の予約確認',
      href: '/guardian/bookings',
      icon: Clock,
      isPrimary: false,
    },
    {
      title: 'レポート',
      description: '学習レポートの確認',
      href: '/guardian/reports',
      icon: FileText,
      isPrimary: false,
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
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            こんにちは、{dbUser?.name}さん
          </h1>
          <p className="text-gray-600">お子様の学習状況を確認しましょう</p>
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className={`cursor-pointer transition-all hover:shadow-md ${
                  action.isPrimary ? 'border-blue-200 bg-blue-50' : ''
                }`}>
                  <CardContent className="flex items-center p-6">
                    <Icon className={`h-8 w-8 mr-4 ${
                      action.isPrimary ? 'text-blue-600' : 'text-gray-600'
                    }`} />
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
              <CardTitle>今後の予約</CardTitle>
              <CardDescription>予定されている授業一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{booking.teacherName}</div>
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
                <Link href="/guardian/bookings">
                  <Button variant="outline">すべての予約を見る</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>最新のレポート</CardTitle>
              <CardDescription>講師からの学習レポート</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{report.title}</div>
                        {!report.isRead && (
                          <Badge className="bg-red-100 text-red-800">新着</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {report.teacherName} • {report.subject} • {report.date}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      読む
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/guardian/reports">
                  <Button variant="outline">すべてのレポートを見る</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Ticket Balance Warning */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <h3 className="font-semibold text-orange-800">チケット残数にご注意ください</h3>
                <p className="text-sm text-orange-600">
                  残りチケット数が少なくなっています。継続的な授業のために追加購入をご検討ください。
                </p>
              </div>
            </div>
            <Link href="/guardian/tickets">
              <Button size="sm">チケット購入</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}