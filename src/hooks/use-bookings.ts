'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/lib/types/database'

export function useBookings(userId: string | undefined, role: 'teacher' | 'guardian' | 'student') {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!userId) {
            setBookings([])
            setLoading(false)
            return
        }

        let mounted = true
        async function fetchBookings() {
            try {
                setLoading(true)
                setError(null)

                let query = supabase.from('bookings').select('*')

                if (role === 'teacher') {
                    query = query.eq('teacher_id', userId)
                } else if (role === 'guardian') {
                    // First get students for this guardian
                    const { data: students, error: sErr } = await supabase
                        .from('students')
                        .select('id')
                        .eq('guardian_id', userId)
                    if (sErr) throw sErr
                    const studentIds = (students || []).map(s => s.id)
                    if (studentIds.length === 0) {
                        if (mounted) {
                            setBookings([])
                            setLoading(false)
                        }
                        return
                    }
                    query = query.in('student_id', studentIds)
                } else {
                    query = query.eq('student_id', userId)
                }

                const { data, error: bErr } = await query
                    .order('start_time', { ascending: true })

                if (bErr) throw bErr
                if (mounted) setBookings(data || [])
            } catch (e: any) {
                if (mounted) setError(e.message || String(e))
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchBookings()
        return () => { mounted = false }
    }, [userId, role, supabase])

    return { bookings, loading, error }
}
