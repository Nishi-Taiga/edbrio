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

type BookingRow = { id: string; start_time: string; end_time: string; status: 'pending' | 'confirmed' | 'canceled' | 'done'; student_id: string }

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確定',
  canceled: 'キャンセル',
  done: '完了',
}

export default function TeacherBookingsPage() {
  const { user } = useAuth()
  const { bookings: items, loading, error, updateBookingStatus } = useBookings(user?.id, 'teacher')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const supabase = useMemo(() => createClient(), [])

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
      toast.success(status === 'confirmed' ? '予約を承認しました' : '予約を拒否しました')
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error('更新に失敗しました')
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">予約一覧</h1>
        {error && <ErrorAlert message={error} />}
        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="予約はありません"
            description="保護者が予約を入れると、ここに表示されます"
          />
        ) : (
          <div className="space-y-3">
            {items.map((b) => (
              <Card key={b.id}>
                <CardHeader><CardTitle className="text-sm">生徒: {studentNames[b.student_id] || b.student_id}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-slate-300">
                      {format(new Date(b.start_time), 'PPP p', { locale: ja })} - {format(new Date(b.end_time), 'p', { locale: ja })}
                      <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs border ${b.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' :
                          b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30' :
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-surface dark:text-slate-300 dark:border-brand-800/20'
                        }`}>
                        {statusLabels[b.status] || b.status}
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
                          <X className="w-4 h-4 mr-1" /> 拒否
                        </Button>
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                          disabled={isUpdating === b.id}
                        >
                          <Check className="w-4 h-4 mr-1" /> 承認
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

