'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookingReport, BookingReportReason } from '@/lib/types/database'

export function useBookingReports(
  userId: string | undefined,
  role: 'teacher' | 'guardian'
) {
  const [reports, setReports] = useState<BookingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchReports = useCallback(async () => {
    if (!userId) {
      setReports([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      if (role === 'teacher') {
        // Teacher: fetch via API (joins bookings by teacher_id server-side)
        const res = await fetch('/api/booking-reports')
        if (!res.ok) throw new Error('Failed to fetch reports')
        const data = await res.json()
        setReports(data.reports || [])
      } else {
        // Guardian: fetch directly via Supabase (RLS handles access)
        const { data, error: rErr } = await supabase
          .from('booking_reports')
          .select('*')
          .eq('reporter_id', userId)
          .order('created_at', { ascending: false })
        if (rErr) throw rErr
        setReports(data || [])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [userId, role, supabase])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const createReport = async (
    bookingId: string,
    reason: BookingReportReason,
    description?: string
  ) => {
    try {
      setError(null)
      const res = await fetch('/api/booking-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reason, description }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create report')
      }
      await fetchReports()
      return await res.json()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw new Error(msg)
    }
  }

  const resolveReport = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      setError(null)
      const res = await fetch(`/api/booking-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to resolve report')
      }
      await fetchReports()
      return await res.json()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw new Error(msg)
    }
  }

  // Count of pending reports (for badge)
  const pendingCount = useMemo(
    () => reports.filter(r => r.status === 'pending').length,
    [reports]
  )

  return {
    reports,
    loading,
    error,
    pendingCount,
    createReport,
    resolveReport,
    refresh: fetchReports,
  }
}
