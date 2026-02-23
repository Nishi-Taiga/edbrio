'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/types/database'

export function useReports(userId: string | undefined, role: 'teacher' | 'guardian' | 'student') {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!userId) {
            setReports([])
            setLoading(false)
            return
        }

        let mounted = true
        async function fetchReports() {
            try {
                setLoading(true)
                setError(null)

                let bookingIds: string[] = []

                if (role === 'teacher') {
                    const { data: bks, error: bErr } = await supabase
                        .from('bookings')
                        .select('id')
                        .eq('teacher_id', userId)
                    if (bErr) throw bErr
                    bookingIds = (bks || []).map(b => b.id)
                } else if (role === 'guardian') {
                    const { data: students, error: sErr } = await supabase
                        .from('students')
                        .select('id')
                        .eq('guardian_id', userId)
                    if (sErr) throw sErr
                    const studentIds = (students || []).map(s => s.id)

                    if (studentIds.length > 0) {
                        const { data: bks, error: bErr } = await supabase
                            .from('bookings')
                            .select('id')
                            .in('student_id', studentIds)
                        if (bErr) throw bErr
                        bookingIds = (bks || []).map(b => b.id)
                    }
                }

                if (bookingIds.length === 0) {
                    if (mounted) {
                        setReports([])
                        setLoading(false)
                    }
                    return
                }

                const { data, error: rErr } = await supabase
                    .from('reports')
                    .select('*')
                    .in('booking_id', bookingIds)
                    .order('published_at', { ascending: false })

                if (rErr) throw rErr
                if (mounted) setReports(data || [])
            } catch (e: any) {
                if (mounted) setError(e.message || String(e))
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchReports()
        return () => { mounted = false }
    }, [userId, role, supabase])

    return { reports, loading, error }
}
