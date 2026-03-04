"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { useBookingReports } from '@/hooks/use-booking-reports'
import { Calendar, AlertTriangle, X } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { toast } from 'sonner'
import { BookingReportReason } from '@/lib/types/database'

type BookingRow = {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'canceled' | 'done'
  teacher_id: string
}

export default function GuardianBookingsPage() {
  const t = useTranslations('guardianBookings')
  const tc = useTranslations('common')
  const { user } = useAuth()

  const statusLabels: Record<string, string> = {
    pending: tc('statusLabels.pending'),
    confirmed: tc('statusLabels.confirmed'),
    canceled: tc('statusLabels.canceled'),
    done: tc('statusLabels.done'),
  }

  const statusFilters = [
    { key: 'all', label: t('filterAll') },
    { key: 'upcoming', label: t('filterUpcoming') },
    { key: 'done', label: t('filterDone') },
    { key: 'canceled', label: t('filterCanceled') },
  ] as const

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<BookingRow[]>([])
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<string>('all')

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)

  // Report dialog state
  const [reportTarget, setReportTarget] = useState<BookingRow | null>(null)
  const [reportReason, setReportReason] = useState<BookingReportReason>('late')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const { updateBookingStatus } = useBookings(user?.id, 'guardian')
  const { reports, createReport, refresh: refreshReports } = useBookingReports(user?.id, 'guardian')

  const load = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user?.id
      if (!uid) { setItems([]); return }

      const { data: students, error: sErr } = await supabase
        .from('students')
        .select('id')
        .eq('guardian_id', uid)
      if (sErr) throw sErr
      const studentIds = (students || []).map(s => s.id)

      if (studentIds.length > 0) {
        const { data, error: bErr } = await supabase
          .from('bookings')
          .select('id,start_time,end_time,status,teacher_id')
          .in('student_id', studentIds)
          .order('start_time', { ascending: false })
          .limit(100)
        if (bErr) throw bErr
        setItems(data || [])

        // Resolve teacher names
        const teacherIds = [...new Set((data || []).map(b => b.teacher_id))]
        if (teacherIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', teacherIds)
          if (users) {
            const map: Record<string, string> = {}
            users.forEach((u: { id: string; name: string }) => { map[u.id] = u.name })
            setTeacherNames(map)
          }
        }
      } else {
        setItems([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  // Helper: can this booking be canceled? (2 hours before start)
  const canCancel = (b: BookingRow) => {
    if (b.status !== 'pending' && b.status !== 'confirmed') return false
    const twoHoursBefore = new Date(new Date(b.start_time).getTime() - 2 * 60 * 60 * 1000)
    return new Date() < twoHoursBefore
  }

  // Helper: can a report be filed for this booking? (after start time, confirmed or done)
  const canReport = (b: BookingRow) => {
    if (b.status !== 'confirmed' && b.status !== 'done') return false
    if (new Date(b.start_time) > new Date()) return false
    // Check no existing pending report
    const existing = reports.find(r => r.booking_id === b.id && r.status === 'pending')
    return !existing
  }

  // Get report for a booking
  const getReport = (bookingId: string) => {
    return reports.find(r => r.booking_id === bookingId)
  }

  const reportStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: t('reportStatusPending'), className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30' }
      case 'approved':
        return { label: t('reportStatusApproved'), className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' }
      case 'auto_approved':
        return { label: t('reportStatusAutoApproved'), className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' }
      case 'rejected':
        return { label: t('reportStatusRejected'), className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30' }
      default:
        return null
    }
  }

  // Handle cancel
  const handleCancel = async () => {
    if (!cancelTarget) return
    setIsCanceling(true)
    try {
      await updateBookingStatus(cancelTarget.id, 'canceled')
      toast.success(t('cancelSuccess'))
      setCancelTarget(null)
      await load()
    } catch {
      toast.error(tc('updateFailed'))
    } finally {
      setIsCanceling(false)
    }
  }

  // Handle report submit
  const handleReport = async () => {
    if (!reportTarget) return
    if (reportReason === 'other' && !reportDescription.trim()) {
      toast.error(t('reportDescriptionRequired'))
      return
    }
    setIsReporting(true)
    try {
      await createReport(reportTarget.id, reportReason, reportDescription.trim() || undefined)
      toast.success(t('reportSuccess'))
      setReportTarget(null)
      setReportReason('late')
      setReportDescription('')
      await refreshReports()
    } catch {
      toast.error(tc('updateFailed'))
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["guardian"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('title')}</h1>
        {error && <ErrorAlert message={error} />}

        {/* Status filter tabs */}
        {!loading && items.length > 0 && (
          <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-fit">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === f.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={{ label: t('emptyAction'), href: "/guardian/booking" }}
          />
        ) : (() => {
          const now = new Date()
          const filtered = items.filter(b => {
            if (filter === 'all') return true
            if (filter === 'upcoming') return (b.status === 'confirmed' || b.status === 'pending') && new Date(b.start_time) >= now
            if (filter === 'done') return b.status === 'done' || (b.status === 'confirmed' && new Date(b.end_time) < now)
            if (filter === 'canceled') return b.status === 'canceled'
            return true
          })
          return filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">{t('noFilterResults')}</div>
          ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const report = getReport(b.id)
              const badge = report ? reportStatusBadge(report.status) : null
              return (
                <Card key={b.id}>
                  <CardHeader><CardTitle className="text-sm">{t('teacherLabel', { name: teacherNames[b.teacher_id] || tc('teacher') })}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700 dark:text-slate-300">
                      {format(new Date(b.start_time), 'PPP p', { locale: ja })} - {format(new Date(b.end_time), 'p', { locale: ja })}
                      <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs border ${
                        b.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' :
                        b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' :
                        b.status === 'canceled' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30' :
                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-surface dark:text-slate-300 dark:border-brand-800/20'
                      }`}>{statusLabels[b.status] || b.status}</span>
                      {badge && (
                        <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs border ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="mt-3 flex gap-2">
                      {canCancel(b) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => setCancelTarget(b)}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          {t('cancelButton')}
                        </Button>
                      )}
                      {canReport(b) && !report && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                          onClick={() => {
                            setReportTarget(b)
                            setReportReason('late')
                            setReportDescription('')
                          }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          {t('reportButton')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          )
        })()}

        {/* Cancel Confirmation Dialog */}
        <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null) }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('cancelConfirmTitle')}</DialogTitle>
              <DialogDescription>{t('cancelConfirmDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={isCanceling}>{tc('cancel')}</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isCanceling}>
                {isCanceling ? tc('processing') : t('cancelButton')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={!!reportTarget} onOpenChange={(o) => { if (!o) setReportTarget(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('reportDialogTitle')}</DialogTitle>
              <DialogDescription>{t('reportDialogDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Reason selection */}
              <div className="space-y-2">
                {(['late', 'absent', 'other'] as const).map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      reportReason === reason
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-400'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={() => setReportReason(reason)}
                      className="accent-brand-500"
                    />
                    <span className="text-sm font-medium">
                      {reason === 'late' ? t('reportReasonLate') :
                       reason === 'absent' ? t('reportReasonAbsent') :
                       t('reportReasonOther')}
                    </span>
                  </label>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {reportReason === 'other' ? t('reportDescriptionRequired') : t('reportDescriptionLabel')}
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder=""
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportTarget(null)} disabled={isReporting}>{tc('cancel')}</Button>
              <Button onClick={handleReport} disabled={isReporting}>
                {isReporting ? t('reportSubmitting') : t('reportSubmit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
