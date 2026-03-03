'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { useTranslations } from 'next-intl'
import { Shield } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/* ---------- Types ---------- */

interface AuditLog {
  id: string
  actor_id: string | null
  actor_name: string | null
  action: string
  target_table: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface ListData {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
}

/* ---------- Component ---------- */

export default function AdminAuditPage() {
  const t = useTranslations('adminAudit')
  const tc = useTranslations('adminCommon')

  const [listData, setListData] = useState<ListData | null>(null)
  const [actionFilter, setActionFilter] = useState('')
  const [targetTableFilter, setTargetTableFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metadataLog, setMetadataLog] = useState<AuditLog | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (actionFilter) params.set('action', actionFilter)
      if (targetTableFilter !== 'all') params.set('target_table', targetTableFilter)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/admin/audit?${params.toString()}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)

      const data: ListData = await res.json()
      setListData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, targetTableFilter, fromDate, toDate, page])

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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {tc('filter')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Input
              type="text"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              placeholder={t('actionPlaceholder')}
              className="w-44"
            />
            <Select value={targetTableFilter} onValueChange={(v) => { setTargetTableFilter(v); setPage(1) }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t('targetTablePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc('all')}</SelectItem>
                <SelectItem value="users">users</SelectItem>
                <SelectItem value="teachers">teachers</SelectItem>
                <SelectItem value="students">students</SelectItem>
                <SelectItem value="student_profiles">student_profiles</SelectItem>
                <SelectItem value="bookings">bookings</SelectItem>
                <SelectItem value="reports">reports</SelectItem>
                <SelectItem value="payments">payments</SelectItem>
                <SelectItem value="tickets">tickets</SelectItem>
                <SelectItem value="ticket_balances">ticket_balances</SelectItem>
                <SelectItem value="availability">availability</SelectItem>
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
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-8">
          <SkeletonList count={8} />
        </div>
      )}

      {/* Main content */}
      {!loading && !error && listData && (
        <Card>
          <CardContent className="pt-6">
            {listData.logs.length === 0 ? (
              <EmptyState
                icon={Shield}
                title={t('noLogs')}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tc('dateTime')}</TableHead>
                        <TableHead>{t('actor')}</TableHead>
                        <TableHead>{tc('action')}</TableHead>
                        <TableHead>{tc('targetTable')}</TableHead>
                        <TableHead>{tc('targetId')}</TableHead>
                        <TableHead>{t('metadata')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listData.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
                          </TableCell>
                          <TableCell>{log.actor_name || log.actor_id || '-'}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{log.action}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{log.target_table || '-'}</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-slate-400 font-mono max-w-[120px] truncate">
                            {log.target_id || '-'}
                          </TableCell>
                          <TableCell>
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMetadataLog(log)}
                              >
                                {tc('details')}
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
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
      )}

      {/* Metadata Dialog */}
      <Dialog
        open={metadataLog !== null}
        onOpenChange={(open) => { if (!open) setMetadataLog(null) }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('metadataDetail')}</DialogTitle>
          </DialogHeader>
          {metadataLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500 dark:text-slate-400">{t('actionLabel')}</div>
                <div className="font-mono">{metadataLog.action}</div>
                <div className="text-gray-500 dark:text-slate-400">{t('targetTableLabel')}</div>
                <div className="font-mono">{metadataLog.target_table || '-'}</div>
                <div className="text-gray-500 dark:text-slate-400">{t('targetIdLabel')}</div>
                <div className="font-mono text-xs break-all">{metadataLog.target_id || '-'}</div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  {t('json')}
                </h4>
                <pre className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto">
                  {JSON.stringify(metadataLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
