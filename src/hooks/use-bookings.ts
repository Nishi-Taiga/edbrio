'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/lib/types/database'

export function useBookings(userId: string | undefined, role: 'teacher' | 'guardian' | 'student') {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    const fetchBookings = useMemo(() => async () => {
        if (!userId) {
            setBookings([])
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            setError(null)
            let query = supabase.from('bookings').select('*')
            if (role === 'teacher') {
                query = query.eq('teacher_id', userId)
            } else if (role === 'guardian') {
                const { data: students, error: sErr } = await supabase
                    .from('students')
                    .select('id')
                    .eq('guardian_id', userId)
                if (sErr) throw sErr
                const studentIds = (students || []).map(s => s.id)
                if (studentIds.length === 0) {
                    setBookings([])
                    setLoading(false)
                    return
                }
                query = query.in('student_id', studentIds)
            } else {
                query = query.eq('student_id', userId)
            }
            const { data, error: bErr } = await query.order('start_time', { ascending: true })
            if (bErr) throw bErr
            setBookings(data || [])
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e))
        } finally {
            setLoading(false)
        }
    }, [userId, role, supabase])

    useEffect(() => {
        fetchBookings()
    }, [fetchBookings])

    const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>, availabilityId: string) => {
        try {
            setError(null)
            // 1. Create booking
            const { data, error: bErr } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single()
            if (bErr) throw bErr

            // 2. Mark availability as not bookable
            const { error: aErr } = await supabase
                .from('availability')
                .update({ is_bookable: false })
                .eq('id', availabilityId)
            if (aErr) throw aErr

            await fetchBookings()
            return data
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            setError(msg)
            throw new Error(msg)
        }
    }

    const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
        try {
            setError(null)
            const { error: bErr } = await supabase
                .from('bookings')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', bookingId)
            if (bErr) throw bErr

            // If canceled, make the corresponding availability bookable again?
            // This depends on whether we linked it. Currently the DB schema for Booking doesn't have availability_id.
            // But we can find it by start_time/teacher_id if needed, or we just leave it.
            // For now, just update status.

            await fetchBookings()
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            setError(msg)
            throw new Error(msg)
        }
    }

    return { bookings, loading, error, createBooking, updateBookingStatus, refresh: fetchBookings }
}
