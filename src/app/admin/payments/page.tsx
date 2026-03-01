'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ---------- Types ---------- */

interface Subscription {
  user_id: string
  name: string
  stripe_subscription_id: string
  created_at: string
}

interface SummaryData {
  totalRevenue: number
  monthRevenue: number
  estimatedFees: number
  mrr: number
  subscriptions: Subscription[]
}

interface Payment {
  id: string
  teacher_id: string | null
  payer_id: string | null
  teacher_name: string | null
  payer_name: string | null
  amount_cents: number
  status: string
  stripe_payment_id: string | null
  created_at: string
}

interface ListData {
  payments: Payment[]
  total: number
  page: number
  limit: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

/* ---------- Formatters ---------- */

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
})

/* ---------- Helpers ---------- */

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'refunded':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default:
      return ''
  }
}

/* ---------- Component ---------- */

export default function AdminPaymentsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [listData, setListData] = useState<ListData | null>(null)
  const [allCompletedPayments, setAllCompletedPayments] = useState<Payment[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, listRes, completedRes] = await Promise.all([
        fetch('/api/admin/payments?type=summary'),
        fetch(`/api/admin/payments?type=list&status=${statusFilter}&page=${page}`),
        fetch('/api/admin/payments?type=list&status=completed&limit=100'),
      ])

      if (!summaryRes.ok) throw new Error(`Summary API returned ${summaryRes.status}`)
      if (!listRes.ok) throw new Error(`List API returned ${listRes.status}`)
      if (!completedRes.ok) throw new Error(`Completed API returned ${completedRes.status}`)

      const summaryData: SummaryData = await summaryRes.json()
      const listDataJson: ListData = await listRes.json()
      const completedData: ListData = await completedRes.json()

      setSummary(summaryData)
      setListData(listDataJson)
      setAllCompletedPayments(completedData.payments)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    load()
  }, [load])

  // Aggregate monthly revenue for bar chart
  const monthlyRevenue: MonthlyRevenue[] = useMemo(() => {
    const monthMap = new Map<string, number>()
    const now = new Date()

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, 0)
    }

    for (const p of allCompletedPayments) {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + p.amount_cents)
      }
    }

    return Array.from(monthMap.entries()).map(([month, cents]) => ({
      month,
      revenue: cents / 100,
    }))
  }, [allCompletedPayments])

  const totalPages = listData ? Math.ceil(listData.total / listData.limit) : 0

  /* ---------- Render ---------- */

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        決済管理
      </h1>
      <p className="text-gray-600 dark:text-slate-400 mb-8">
        プラットフォームの決済状況
      </p>

      {/* Error */}
      {error && <ErrorAlert message={error} onRetry={load} />}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-8">
          <SkeletonStatsGrid count={4} />
          <SkeletonList count={5} />
        </div>
      )}

      {/* Main content */}
      {!loading && !error && summary && listData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  総売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {yenFormatter.format(summary.totalRevenue / 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  今月売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {yenFormatter.format(summary.monthRevenue / 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  推定手数料収入
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {yenFormatter.format(summary.estimatedFees / 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {yenFormatter.format(summary.mrr)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                サブスクリプション一覧
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.subscriptions.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="サブスクリプションはありません"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>講師名</TableHead>
                        <TableHead>Subscription ID</TableHead>
                        <TableHead>登録日</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.subscriptions.map((sub) => (
                        <TableRow key={sub.user_id}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                            {sub.stripe_subscription_id || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sub.created_at), 'yyyy/MM/dd', { locale: ja })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  決済一覧
                </CardTitle>
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="ステータス" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="completed">completed</SelectItem>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="failed">failed</SelectItem>
                      <SelectItem value="refunded">refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {listData.payments.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="決済データはありません"
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日時</TableHead>
                          <TableHead>講師</TableHead>
                          <TableHead>支払者</TableHead>
                          <TableHead>金額</TableHead>
                          <TableHead>ステータス</TableHead>
                          <TableHead>Stripe ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listData.payments.map((p) => (
                          <TableRow
                            key={p.id}
                            className={
                              p.status === 'failed'
                                ? 'bg-red-50/50 dark:bg-red-900/10'
                                : ''
                            }
                          >
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(p.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </TableCell>
                            <TableCell>{p.teacher_name || '-'}</TableCell>
                            <TableCell>{p.payer_name || '-'}</TableCell>
                            <TableCell className="font-medium">
                              {yenFormatter.format(p.amount_cents / 100)}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusBadgeClass(p.status)}>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500 dark:text-slate-400 font-mono max-w-[120px] truncate">
                              {p.stripe_payment_id || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        全{listData.total}件中 {(page - 1) * listData.limit + 1}-
                        {Math.min(page * listData.limit, listData.total)}件
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          前へ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          次へ
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                月別売上推移 (過去12ヶ月)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyRevenue.length === 0 ? (
                <EmptyState icon={CreditCard} title="売上データがありません" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => yenFormatter.format(v)}
                    />
                    <Tooltip
                      labelFormatter={(label) => String(label)}
                      formatter={(value) => [yenFormatter.format(Number(value)), '売上']}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
