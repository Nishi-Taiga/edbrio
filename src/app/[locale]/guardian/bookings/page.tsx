"use client"

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'

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

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
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
          if (mounted) setItems(data || [])

          // Resolve teacher names
          const teacherIds = [...new Set((data || []).map(b => b.teacher_id))]
          if (teacherIds.length > 0) {
            const { data: users } = await supabase
              .from('users')
              .select('id, name')
              .in('id', teacherIds)
            if (mounted && users) {
              const map: Record<string, string> = {}
              users.forEach((u: { id: string; name: string }) => { map[u.id] = u.name })
              setTeacherNames(map)
            }
          }
        } else {
          if (mounted) setItems([])
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

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
            {filtered.map((b) => (
              <Card key={b.id}>
                <CardHeader><CardTitle className="text-sm">{t('teacherLabel', { name: teacherNames[b.teacher_id] || b.teacher_id })}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 dark:text-slate-300">
                    {format(new Date(b.start_time), 'PPP p', { locale: ja })} - {format(new Date(b.end_time), 'p', { locale: ja })}
                    <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs border ${
                      b.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' :
                      b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' :
                      b.status === 'canceled' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30' :
                      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-surface dark:text-slate-300 dark:border-brand-800/20'
                    }`}>{statusLabels[b.status] || b.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )
        })()}
      </div>
    </ProtectedRoute>
  )
}

