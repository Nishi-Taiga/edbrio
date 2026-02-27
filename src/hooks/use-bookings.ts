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

            // 3. Deduct remaining_minutes from ticket balance
            if (bookingData.ticket_balance_id) {
                const startMs = new Date(bookingData.start_time).getTime()
                const endMs = new Date(bookingData.end_time).getTime()
                const durationMinutes = Math.round((endMs - startMs) / (1000 * 60))

                const { data: balance, error: balFetchErr } = await supabase
                    .from('ticket_balances')
                    .select('remaining_minutes')
                    .eq('id', bookingData.ticket_balance_id)
                    .single()
                if (balFetchErr) throw balFetchErr

                if (balance && durationMinutes > 0) {
                    const newRemaining = Math.max(0, (balance.remaining_minutes || 0) - durationMinutes)
                    const { error: balUpdErr } = await supabase
                        .from('ticket_balances')
                        .update({ remaining_minutes: newRemaining })
                        .eq('id', bookingData.ticket_balance_id)
                    if (balUpdErr) throw balUpdErr
                }
            }

            // Fire-and-forget email notification
            if (data?.id) {
                fetch('/api/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'booking_confirmation', data: { bookingId: data.id } }),
                }).catch(console.error)
            }

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

            // If canceled, restore availability and ticket balance
            if (status === 'canceled') {
                const { data: booking, error: fetchErr } = await supabase
                    .from('bookings')
                    .select('teacher_id, start_time, end_time, ticket_balance_id')
                    .eq('id', bookingId)
                    .single()
                if (fetchErr) throw fetchErr

                if (booking) {
                    // Restore availability slot
                    await supabase
                        .from('availability')
                        .update({ is_bookable: true })
                        .eq('teacher_id', booking.teacher_id)
                        .eq('slot_start', booking.start_time)
                        .eq('slot_end', booking.end_time)

                    // Restore ticket balance minutes
                    if (booking.ticket_balance_id) {
                        const startMs = new Date(booking.start_time).getTime()
                        const endMs = new Date(booking.end_time).getTime()
                        const durationMinutes = Math.round((endMs - startMs) / (1000 * 60))

                        if (durationMinutes > 0) {
                            const { data: balance } = await supabase
                                .from('ticket_balances')
                                .select('remaining_minutes')
                                .eq('id', booking.ticket_balance_id)
                                .single()

                            if (balance) {
                                await supabase
                                    .from('ticket_balances')
                                    .update({ remaining_minutes: (balance.remaining_minutes || 0) + durationMinutes })
                                    .eq('id', booking.ticket_balance_id)
                            }
                        }
                    }
                }
            }

            await fetchBookings()
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            setError(msg)
            throw new Error(msg)
        }
    }

    return { bookings, loading, error, createBooking, updateBookingStatus, refresh: fetchBookings }
}
