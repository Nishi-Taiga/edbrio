'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { BookOpen, Calendar, CreditCard, Users } from 'lucide-react'

export default function HomePage() {
  const { user, dbUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect authenticated users to their dashboard
  if (user && dbUser) {
    if (dbUser.role === 'teacher') {
      window.location.href = '/teacher/dashboard'
      return null
    } else if (dbUser.role === 'guardian') {
      window.location.href = '/guardian/home'
      return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          家庭教師とのマッチングを
          <span className="text-blue-600">もっと簡単に</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          EdBrioは講師と生徒をつなぐプラットフォーム。予約管理から決済まで、必要な機能がすべて揃っています。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              講師として始める
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              生徒・保護者として登録
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <Card>
          <CardHeader>
            <Calendar className="w-12 h-12 text-blue-600 mb-4" />
            <CardTitle>簡単予約管理</CardTitle>
            <CardDescription>
              カレンダーから空き時間を登録し、生徒からの予約を効率的に管理
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CreditCard className="w-12 h-12 text-blue-600 mb-4" />
            <CardTitle>安全な決済</CardTitle>
            <CardDescription>
              チケット制による前払いシステムで、安心・安全な取引を実現
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
            <CardTitle>学習レポート</CardTitle>
            <CardDescription>
              授業後のレポート機能で、学習の進捗を保護者と共有
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <CardTitle>講師プロフィール</CardTitle>
            <CardDescription>
              専用URLで講師の情報を公開し、新規生徒の獲得をサポート
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* How it works */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">使い方</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">アカウント作成</h3>
            <p className="text-gray-600">講師または保護者として無料でアカウントを作成</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">プロフィール設定</h3>
            <p className="text-gray-600">講師は指導可能科目や時間を設定、保護者は生徒情報を入力</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">授業開始</h3>
            <p className="text-gray-600">チケット購入後、予約を取って授業スタート</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">今すぐ始めよう</h2>
        <p className="text-xl mb-6">
          EdBrioで家庭教師をもっと効率的に、もっと楽しく
        </p>
        <Link href="/auth">
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            無料で始める
          </Button>
        </Link>
      </div>
    </div>
  )
}
