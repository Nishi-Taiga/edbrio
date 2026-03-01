'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Shield } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ---------- Types ---------- */

interface StatsData {
  totalUsers: number
  usersByRole: Record<string, number>
  teachersByPlan: Record<string, number>
  mrr: number
  monthRevenue: number
  monthAiReports: number
  monthBookings: number
  failedPayments24h: number
  expiringTickets7d: number
  incompleteInitialSetup: number
}

interface TrendPoint {
  date: string
  count: number
}

interface RevenueTrendPoint {
  date: string
  amount: number
}

interface TrendsData {
  period: string
  signups: TrendPoint[]
  revenue: RevenueTrendPoint[]
  bookings: TrendPoint[]
  aiReports: TrendPoint[]
}

type TrendPeriod = '7d' | '30d'

/* ---------- Formatters ---------- */

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
})

/* ---------- Component ---------- */

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, trendsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/stats/trends?period=${trendPeriod}`),
      ])

      if (!statsRes.ok) {
        throw new Error(`Stats API returned ${statsRes.status}`)
      }
      if (!trendsRes.ok) {
        throw new Error(`Trends API returned ${trendsRes.status}`)
      }

      const statsData: StatsData = await statsRes.json()
      const trendsData: TrendsData = await trendsRes.json()

      setStats(statsData)
      setTrends(trendsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [trendPeriod])

  useEffect(() => {
    load()
  }, [load])

  /* ---------- Render ---------- */

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        管理者ダッシュボード
      </h1>
      <p className="text-gray-600 dark:text-slate-400">
        プラットフォームの概要
      </p>

      {/* Error */}
      {error && <ErrorAlert message={error} onRetry={load} />}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-8 space-y-8">
          <SkeletonStatsGrid count={4} />
          <SkeletonList count={3} />
        </div>
      )}

      {/* Main content */}
      {!loading && !error && stats && trends && (
        <>
          {/* -------- KPI Cards -------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-8">
            {/* Total Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  総ユーザー数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    講師 {stats.usersByRole.teacher ?? 0}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    保護者 {stats.usersByRole.guardian ?? 0}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    生徒 {stats.usersByRole.student ?? 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* MRR */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {yenFormatter.format(stats.mrr)}
                </p>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  今月売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {yenFormatter.format(stats.monthRevenue / 100)}
                </p>
              </CardContent>
            </Card>

            {/* Monthly AI Reports */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  今月AI生成数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.monthAiReports}件
                </p>
              </CardContent>
            </Card>
          </div>

          {/* -------- Trend Charts -------- */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              期間:
            </span>
            <button
              onClick={() => setTrendPeriod('7d')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                trendPeriod === '7d'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              7日間
            </button>
            <button
              onClick={() => setTrendPeriod('30d')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                trendPeriod === '30d'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              30日間
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Signups */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  新規ユーザー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trends.signups}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => String(label)}
                      formatter={(value) => [value, '新規ユーザー']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={trends.revenue.map((d) => ({
                      date: d.date,
                      amount: d.amount / 100,
                    }))}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => String(label)}
                      formatter={(value) => [
                        yenFormatter.format(Number(value)),
                        '売上',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bookings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  予約数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trends.bookings}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => String(label)}
                      formatter={(value) => [value, '予約数']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Reports */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  AI生成数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trends.aiReports}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(label) => String(label)}
                      formatter={(value) => [value, 'AI生成数']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* -------- System Alerts -------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Failed payments */}
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  決済失敗 (24h)
                </span>
                <span
                  className={`text-sm font-bold ${
                    stats.failedPayments24h > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {stats.failedPayments24h}件
                </span>
              </CardContent>
            </Card>

            {/* Expiring tickets */}
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  期限切れ間近チケット
                </span>
                <span
                  className={`text-sm font-bold ${
                    stats.expiringTickets7d > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {stats.expiringTickets7d}件
                </span>
              </CardContent>
            </Card>

            {/* Incomplete initial setup */}
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  未完了初期設定
                </span>
                <span
                  className={`text-sm font-bold ${
                    stats.incompleteInitialSetup > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {stats.incompleteInitialSetup}件
                </span>
              </CardContent>
            </Card>
          </div>

          {/* -------- Recent Activity (audit logs placeholder) -------- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                最近のアクティビティ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Shield}
                title="監査ログはまだ記録されていません"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
