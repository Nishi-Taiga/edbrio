'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

/* ---------- Types ---------- */

interface StatsData {
  totalReports: number
  monthReports: number
  aiReports: number
  avgComprehension: number | null
  moodDistribution: Record<string, number>
  topAiUsers: Array<{ teacher_id: string; name: string; ai_report_count: number }>
}

interface Report {
  id: string
  teacher_id: string | null
  profile_id: string | null
  teacher_name: string | null
  student_name: string | null
  subject: string | null
  comprehension_level: number | null
  student_mood: string | null
  visibility: string | null
  content_raw: string | null
  ai_summary: string | null
  created_at: string
}

interface ListData {
  reports: Report[]
  total: number
  page: number
  limit: number
}

/* ---------- Constants ---------- */

const MOOD_COLORS: Record<string, string> = {
  good: '#10b981',
  neutral: '#6b7280',
  tired: '#f59e0b',
  unmotivated: '#ef4444',
}

const MOOD_LABELS: Record<string, string> = {
  good: '良好',
  neutral: '普通',
  tired: '疲れ',
  unmotivated: 'やる気なし',
}

/* ---------- Helpers ---------- */

function moodBadgeClass(mood: string): string {
  switch (mood) {
    case 'good':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'neutral':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'tired':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'unmotivated':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

function visibilityBadgeClass(visibility: string): string {
  switch (visibility) {
    case 'public':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'private':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default:
      return ''
  }
}

function renderComprehension(level: number | null): string {
  if (level === null) return '-'
  return `${'★'.repeat(level)}${'☆'.repeat(Math.max(0, 5 - level))}`;
}

/* ---------- Component ---------- */

export default function AdminReportsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [listData, setListData] = useState<ListData | null>(null)
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [hasAiFilter, setHasAiFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ type: 'list', page: String(page) })
      if (visibilityFilter !== 'all') params.set('visibility', visibilityFilter)
      if (hasAiFilter !== 'all') params.set('has_ai', hasAiFilter)

      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/reports?type=stats'),
        fetch(`/api/admin/reports?${params.toString()}`),
      ])

      if (!statsRes.ok) throw new Error(`Stats API returned ${statsRes.status}`)
      if (!listRes.ok) throw new Error(`List API returned ${listRes.status}`)

      const statsData: StatsData = await statsRes.json()
      const listDataJson: ListData = await listRes.json()

      setStats(statsData)
      setListData(listDataJson)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [visibilityFilter, hasAiFilter, page])

  useEffect(() => {
    load()
  }, [load])

  // Prepare chart data
  const moodChartData = stats
    ? Object.entries(stats.moodDistribution)
        .filter(([, count]) => count > 0)
        .map(([mood, count]) => ({
          name: MOOD_LABELS[mood] || mood,
          value: count,
          color: MOOD_COLORS[mood] || '#9ca3af',
        }))
    : []

  const aiUsageChartData = stats?.topAiUsers ?? []

  const totalPages = listData ? Math.ceil(listData.total / listData.limit) : 0

  /* ---------- Render ---------- */

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        レポート分析
      </h1>
      <p className="text-gray-600 dark:text-slate-400 mb-8">
        AIレポートの利用状況
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
      {!loading && !error && stats && listData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  総レポート数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalReports}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  今月
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.monthReports}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  AI生成数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.aiReports}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  平均理解度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgComprehension !== null
                    ? `${stats.avgComprehension}/5`
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Mood Distribution Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  ムード分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moodChartData.length === 0 ? (
                  <EmptyState icon={FileText} title="ムードデータがありません" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={moodChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${((percent as number) * 100).toFixed(0)}%`
                        }
                      >
                        {moodChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* AI Usage by Teacher Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  講師別AI利用数 (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiUsageChartData.length === 0 ? (
                  <EmptyState icon={FileText} title="AI利用データがありません" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={aiUsageChartData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value) => [value, 'AI生成数']}
                      />
                      <Bar dataKey="ai_report_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  レポート一覧
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={visibilityFilter} onValueChange={(v) => { setVisibilityFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="公開状態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="public">公開</SelectItem>
                      <SelectItem value="private">非公開</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={hasAiFilter} onValueChange={(v) => { setHasAiFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="AI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="true">AI有り</SelectItem>
                      <SelectItem value="false">AI無し</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {listData.reports.length === 0 ? (
                <EmptyState icon={FileText} title="レポートはありません" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日時</TableHead>
                          <TableHead>講師</TableHead>
                          <TableHead>生徒</TableHead>
                          <TableHead>科目</TableHead>
                          <TableHead>理解度</TableHead>
                          <TableHead>ムード</TableHead>
                          <TableHead>公開状態</TableHead>
                          <TableHead>AI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listData.reports.map((r) => (
                          <TableRow
                            key={r.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            onClick={() => setSelectedReport(r)}
                          >
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(r.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </TableCell>
                            <TableCell>{r.teacher_name || '-'}</TableCell>
                            <TableCell>{r.student_name || '-'}</TableCell>
                            <TableCell>{r.subject || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {renderComprehension(r.comprehension_level)}
                            </TableCell>
                            <TableCell>
                              {r.student_mood ? (
                                <Badge className={moodBadgeClass(r.student_mood)}>
                                  {MOOD_LABELS[r.student_mood] || r.student_mood}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {r.visibility ? (
                                <Badge className={visibilityBadgeClass(r.visibility)}>
                                  {r.visibility === 'public' ? '公開' : '非公開'}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {r.ai_summary ? (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                  AI
                                </Badge>
                              ) : (
                                '-'
                              )}
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

          {/* Content Dialog */}
          <Dialog open={selectedReport !== null} onOpenChange={(open) => { if (!open) setSelectedReport(null) }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>レポート詳細</DialogTitle>
                <DialogDescription>
                  {selectedReport && (
                    <>
                      {selectedReport.teacher_name || '不明'} - {selectedReport.student_name || '不明'}
                      {' '}
                      ({format(new Date(selectedReport.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })})
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {selectedReport && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      講師メモ (content_raw)
                    </h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedReport.content_raw || '(なし)'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      AI生成コンテンツ (ai_summary)
                    </h4>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedReport.ai_summary || '(なし)'}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
