"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useBookings } from '@/hooks/use-bookings'
import { Button } from '@/components/ui/button'
import { Calendar, Check, X } from 'lucide-react'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useTranslations } from 'next-intl'

type BookingRow = { id: string; start_time: string; end_time: string; status: 'pending' | 'confirmed' | 'canceled' | 'done'; student_id: string }

export default function TeacherBookingsPage() {
  const t = useTranslations('teacherBookings')
  const tc = useTranslations('common')
  const { user } = useAuth()
  const { bookings: items, loading, error, updateBookingStatus } = useBookings(user?.id, 'teacher')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<string>('all')
  const supabase = useMemo(() => createClient(), [])

  const statusFilters = [
    { key: 'all', label: t('filterAll') },
    { key: 'upcoming', label: t('filterUpcoming') },
    { key: 'done', label: t('filterDone') },
    { key: 'canceled', label: t('filterCanceled') },
  ] as const

  // Resolve student UUIDs to names
  useEffect(() => {
    if (items.length === 0) return
    const ids = [...new Set(items.map(b => b.student_id))]
    supabase
      .from('student_profiles')
      .select('student_id, name')
      .in('student_id', ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach(p => { if (p.student_id) map[p.student_id] = p.name })
          setStudentNames(map)
        }
      })
  }, [items, supabase])

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'canceled') => {
    setIsUpdating(id)
    try {
      await updateBookingStatus(id, status)
      toast.success(status === 'confirmed' ? t('approveSuccess') : t('rejectSuccess'))
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error(tc('updateFailed'))
    } finally {
      setIsUpdating(null)
    }
  }

  const now = new Date()
  const filtered = items.filter(b => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return (b.status === 'confirmed' || b.status === 'pending') && new Date(b.start_time) >= now
    if (filter === 'done') return b.status === 'done' || (b.status === 'confirmed' && new Date(b.end_time) < now)
    if (filter === 'canceled') return b.status === 'canceled'
    return true
  })

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
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
          />
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">{t('noFilterResults')}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
              <Card key={b.id}>
                <CardHeader><CardTitle className="text-sm">{t('studentLabel', { name: studentNames[b.student_id] || b.student_id })}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-slate-300">
                      {format(new Date(b.start_time), 'PPP p', { locale: ja })} - {format(new Date(b.end_time), 'p', { locale: ja })}
                      <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs border ${b.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' :
                          b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' :
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-surface dark:text-slate-300 dark:border-brand-800/20'
                        }`}>
                        {tc('statusLabels.' + b.status)}
                      </span>
                    </div>
                    {b.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 hover:text-red-700"
                          onClick={() => handleStatusUpdate(b.id, 'canceled')}
                          disabled={isUpdating === b.id}
                        >
                          <X className="w-4 h-4 mr-1" /> {t('rejectButton')}
                        </Button>
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                          disabled={isUpdating === b.id}
                        >
                          <Check className="w-4 h-4 mr-1" /> {t('approveButton')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
