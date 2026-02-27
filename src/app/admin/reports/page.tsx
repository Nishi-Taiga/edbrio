import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/admin/kpi-card'
import { getReportsForAdmin, getReportStats } from '@/lib/admin/queries'
import Link from 'next/link'
import { ReportFilters } from './report-filters'
import { ReportPreview } from './report-preview'

interface Props {
  searchParams: Promise<{ visibility?: string; search?: string; page?: string }>
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const perPage = 20

  const [{ reports, total }, stats] = await Promise.all([
    getReportsForAdmin({ visibility: params.visibility, search: params.search, page, perPage }),
    getReportStats(),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">レポート監視</h1>
        <p className="text-gray-600 dark:text-slate-400">レポートの一覧と統計</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard title="総レポート数" value={stats.totalReports} />
        <KpiCard title="今月の公開数" value={stats.publishedThisMonth} />
        <KpiCard title="平均理解度" value={stats.avgComprehension > 0 ? `${stats.avgComprehension} / 5` : '—'} />
      </div>

      {/* Filters */}
      <ReportFilters visibility={params.visibility} search={params.search} />

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">レポート一覧（{total}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">日付</th>
                  <th className="pb-2 pr-4">講師</th>
                  <th className="pb-2 pr-4">科目</th>
                  <th className="pb-2 pr-4">公開状態</th>
                  <th className="pb-2 pr-4">理解度</th>
                  <th className="pb-2">内容</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      レポートが見つかりません。
                    </td>
                  </tr>
                ) : (
                  reports.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 pr-4">{r.teacher?.name || '—'}</td>
                      <td className="py-3 pr-4">{r.subject || '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={
                            r.visibility === 'published'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }
                        >
                          {r.visibility === 'published' ? '公開' : '下書き'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{r.comprehension_level ?? '—'}</td>
                      <td className="py-3">
                        <ReportPreview report={r} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link href={`/admin/reports?${buildQuery(params, page - 1)}`}>
                  <Button variant="outline" size="sm">前へ</Button>
                </Link>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/admin/reports?${buildQuery(params, page + 1)}`}>
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
  if (params.visibility) q.set('visibility', params.visibility)
  if (params.search) q.set('search', params.search)
  q.set('page', String(page))
  return q.toString()
}
