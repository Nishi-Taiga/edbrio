import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/admin/kpi-card'
import { BarChart } from '@/components/admin/bar-chart'
import { getPayments, getRevenueStats, getMonthlyRevenue } from '@/lib/admin/queries'
import Link from 'next/link'
import { PaymentFilters } from './payment-filters'

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

function formatYen(cents: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(cents / 100)
}

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: '完了', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  pending: { label: '保留', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  failed: { label: '失敗', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  refunded: { label: '返金', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const perPage = 20

  const [{ payments, total }, revenueStats, monthlyRevenue] = await Promise.all([
    getPayments({ status: params.status, page, perPage }),
    getRevenueStats(),
    getMonthlyRevenue(6),
  ])

  const totalPages = Math.ceil(total / perPage)

  const chartData = monthlyRevenue.map((r) => ({
    label: r.month.slice(5),
    value: r.total,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">決済管理</h1>
        <p className="text-gray-600 dark:text-slate-400">売上と決済の管理</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="今月の売上" value={formatYen(revenueStats.thisMonthRevenue)} />
        <KpiCard title="先月の売上" value={formatYen(revenueStats.lastMonthRevenue)} />
        <KpiCard title="未処理" value={revenueStats.pendingCount} />
        <KpiCard title="返金" value={revenueStats.refundedCount} />
      </div>

      {/* Revenue Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>売上推移（直近6ヶ月）</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={chartData} formatValue={(v) => formatYen(v)} />
        </CardContent>
      </Card>

      {/* Filters */}
      <PaymentFilters status={params.status} />

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">決済一覧（{total}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">日付</th>
                  <th className="pb-2 pr-4">講師</th>
                  <th className="pb-2 pr-4">支払者</th>
                  <th className="pb-2 pr-4">金額</th>
                  <th className="pb-2">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      決済が見つかりません。
                    </td>
                  </tr>
                ) : (
                  payments.map((p: any) => {
                    const badge = statusBadge[p.status] || { label: p.status, className: '' }
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {new Date(p.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="py-3 pr-4">{p.teacher?.name || '—'}</td>
                        <td className="py-3 pr-4">{p.payer?.name || '—'}</td>
                        <td className="py-3 pr-4 font-medium">{formatYen(p.amount_cents)}</td>
                        <td className="py-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link href={`/admin/payments?${buildQuery(params, page - 1)}`}>
                  <Button variant="outline" size="sm">前へ</Button>
                </Link>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/admin/payments?${buildQuery(params, page + 1)}`}>
                  <Button variant="outline" size="sm">次へ</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function buildQuery(params: Record<string, string | undefined>, page: number) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  q.set('page', String(page))
  return q.toString()
}
