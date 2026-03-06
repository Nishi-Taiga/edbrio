'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/* ---------- Types ---------- */

interface Utilization {
  teacher_id: string
  teacher_name: string
  total_slots: number
  booked_slots: number
  rate: number
}

interface StatsData {
  totalBookings: number
  monthBookings: number
  byStatus: Record<string, number>
  cancelRate: number
  utilization: Utilization[]
}

interface Booking {
  id: string
  teacher_id: string | null
  student_id: string | null
  teacher_name: string | null
  student_name: string | null
  status: string
  start_time: string | null
  end_time: string | null
  created_at: string
}

interface ListData {
  bookings: Booking[]
  total: number
  page: number
  limit: number
}

/* ---------- Helpers ---------- */

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'done':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return ''
  }
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return '-'
  const s = format(new Date(start), 'HH:mm', { locale: ja })
  if (!end) return s
  const e = format(new Date(end), 'HH:mm', { locale: ja })
  return `${s} - ${e}`
}

/* ---------- Component ---------- */

export default function AdminBookingsPage() {
  const t = useTranslations('adminBookings')
  const tc = useTranslations('adminCommon')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [listData, setListData] = useState<ListData | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const listParams = new URLSearchParams({ type: 'list', page: String(page) })
      if (statusFilter !== 'all') listParams.set('status', statusFilter)
      if (fromDate) listParams.set('from', fromDate)
      if (toDate) listParams.set('to', toDate)

      const [statsRes, listRes] = await Promise.all([
        fetch('/api/admin/bookings?type=stats'),
        fetch(`/api/admin/bookings?${listParams.toString()}`),
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
  }, [statusFilter, fromDate, toDate, page])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = listData ? Math.ceil(listData.total / listData.limit) : 0

  /* ---------- Render ---------- */

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('title')}
      </h1>
      <p className="text-gray-600 dark:text-slate-400 mb-8">
        {t('description')}
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
                  {t('totalBookings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {t('thisMonth')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.monthBookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {t('byStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <Badge key={status} className={statusBadgeClass(status)}>
                      {status} {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {t('cancelRate')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.cancelRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {t('bookingList')}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder={tc('status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc('all')}</SelectItem>
                      <SelectItem value="confirmed">confirmed</SelectItem>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="canceled">canceled</SelectItem>
                      <SelectItem value="done">done</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
                    className="w-40"
                    placeholder={tc('startDate')}
                  />
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setPage(1) }}
                    className="w-40"
                    placeholder={tc('endDate')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {listData.bookings.length === 0 ? (
                <EmptyState icon={CalendarDays} title={t('noBookingData')} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tc('dateTime')}</TableHead>
                          <TableHead>{tc('teacher')}</TableHead>
                          <TableHead>{tc('student')}</TableHead>
                          <TableHead>{tc('status')}</TableHead>
                          <TableHead>{t('time')}</TableHead>
                          <TableHead>{t('createdAt')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listData.bookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="whitespace-nowrap">
                              {b.start_time
                                ? format(new Date(b.start_time), 'yyyy/MM/dd', { locale: ja })
                                : '-'}
                            </TableCell>
                            <TableCell>{b.teacher_name || '-'}</TableCell>
                            <TableCell>{b.student_name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={statusBadgeClass(b.status)}>
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatTimeRange(b.start_time, b.end_time)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(b.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
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
                        {tc('paginationInfo', { total: listData.total, from: (page - 1) * listData.limit + 1, to: Math.min(page * listData.limit, listData.total) })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          {tc('prev')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          {tc('next')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('teacherUtilization')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.utilization.length === 0 ? (
                <EmptyState icon={CalendarDays} title={t('noUtilizationData')} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('teacherName')}</TableHead>
                        <TableHead>{t('totalSlots')}</TableHead>
                        <TableHead>{t('bookedSlots')}</TableHead>
                        <TableHead>{t('utilizationRate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.utilization.map((u) => (
                        <TableRow key={u.teacher_id}>
                          <TableCell className="font-medium">{u.teacher_name}</TableCell>
                          <TableCell>{u.total_slots}</TableCell>
                          <TableCell>{u.booked_slots}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[120px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${Math.min(u.rate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                {u.rate}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
