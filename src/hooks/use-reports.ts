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

                if (role === 'teacher') {
                    const { data: bks, error: bErr } = await supabase
                        .from('bookings')
                        .select('id')
                        .eq('teacher_id', userId)
                    if (bErr) throw bErr
                    const bookingIds = (bks || []).map(b => b.id)

                    if (bookingIds.length === 0) {
                        if (mounted) { setReports([]); setLoading(false) }
                        return
                    }

                    const { data, error: rErr } = await supabase
                        .from('reports')
                        .select('*')
                        .in('booking_id', bookingIds)
                        .order('published_at', { ascending: false })
                    if (rErr) throw rErr
                    if (mounted) setReports(data || [])

                } else if (role === 'guardian') {
                    // Get guardian's students
                    const { data: students, error: sErr } = await supabase
                        .from('students')
                        .select('id')
                        .eq('guardian_id', userId)
                    if (sErr) throw sErr
                    const studentIds = (students || []).map(s => s.id)

                    if (studentIds.length === 0) {
                        if (mounted) { setReports([]); setLoading(false) }
                        return
                    }

                    // Path A: via bookings (legacy)
                    let bookingReports: Report[] = []
                    const { data: bks, error: bErr } = await supabase
                        .from('bookings')
                        .select('id')
                        .in('student_id', studentIds)
                    if (bErr) throw bErr
                    const bookingIds = (bks || []).map(b => b.id)

                    if (bookingIds.length > 0) {
                        const { data, error: rErr } = await supabase
                            .from('reports')
                            .select('*')
                            .in('booking_id', bookingIds)
                            .eq('visibility', 'public')
                            .order('published_at', { ascending: false })
                        if (rErr) throw rErr
                        bookingReports = data || []
                    }

                    // Path B: via student_profiles (new - for booking-less reports)
                    let profileReports: Report[] = []
                    const { data: profiles, error: pErr } = await supabase
                        .from('student_profiles')
                        .select('id')
                        .in('student_id', studentIds)
                    if (pErr) throw pErr
                    const profileIds = (profiles || []).map(p => p.id)

                    if (profileIds.length > 0) {
                        const { data, error: rErr } = await supabase
                            .from('reports')
                            .select('*')
                            .in('profile_id', profileIds)
                            .eq('visibility', 'public')
                            .order('published_at', { ascending: false })
                        if (rErr) throw rErr
                        profileReports = data || []
                    }

                    // Merge & deduplicate
                    const allReports = [...bookingReports, ...profileReports]
                    const seen = new Set<string>()
                    const deduped = allReports.filter(r => {
                        if (seen.has(r.id)) return false
                        seen.add(r.id)
                        return true
                    }).sort((a, b) => {
                        const aDate = a.published_at ? new Date(a.published_at).getTime() : 0
                        const bDate = b.published_at ? new Date(b.published_at).getTime() : 0
                        return bDate - aDate
                    })

                    if (mounted) setReports(deduped)
                }
            } catch (e: unknown) {
                if (mounted) setError(e instanceof Error ? e.message : String(e))
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchReports()
        return () => { mounted = false }
    }, [userId, role, supabase])

    return { reports, loading, error }
}
