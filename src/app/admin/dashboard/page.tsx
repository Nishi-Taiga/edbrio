import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/admin/kpi-card'
import { BarChart } from '@/components/admin/bar-chart'
import { getDashboardStats, getMonthlyRevenue, getRecentAuditLogs } from '@/lib/admin/queries'
import { AuditLog } from '@/lib/types/database'

function formatYen(cents: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(cents / 100)
}

function trendPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default async function AdminDashboardPage() {
  const [stats, revenue, logs] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenue(6),
    getRecentAuditLogs(10),
  ])

  const chartData = revenue.map((r) => ({
    label: r.month.slice(5),
    value: r.total,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ダッシュボード</h1>
        <p className="text-gray-600 dark:text-slate-400">システム全体の統計情報</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="総ユーザー数"
          value={stats.totalUsers}
          trend={trendPercent(stats.totalUsers, stats.totalUsers - stats.prevMonthUsers)}
          description="前月比"
        />
        <KpiCard
          title="アクティブ講師"
          value={stats.activeTeachers}
          trend={trendPercent(stats.activeTeachers, stats.activeTeachers - stats.prevMonthTeachers)}
          description="前月比"
        />
        <KpiCard
          title="今月の売上"
          value={formatYen(stats.monthRevenue)}
          trend={trendPercent(stats.monthRevenue, stats.prevMonthRevenue)}
          description="前月比"
        />
        <KpiCard
          title="今月の予約"
          value={stats.monthBookings}
          trend={trendPercent(stats.monthBookings, stats.prevMonthBookings)}
          description="前月比"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>売上推移（直近6ヶ月）</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={chartData} formatValue={(v) => formatYen(v)} />
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <CardTitle>その他の統計</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600 dark:text-slate-400">Proプラン講師</dt>
                <dd className="font-medium">{stats.proTeachers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600 dark:text-slate-400">アクティブチケット</dt>
                <dd className="font-medium">{stats.activeTickets}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600 dark:text-slate-400">保留中予約</dt>
                <dd className="font-medium">{stats.pendingBookings}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600 dark:text-slate-400">公開レポート</dt>
                <dd className="font-medium">{stats.publishedReports}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm">操作ログはありません。</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log: AuditLog) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div>
                    <span className="font-medium">{log.action}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      {log.target_table}{log.target_id ? ` / ${log.target_id.slice(0, 8)}...` : ''}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
