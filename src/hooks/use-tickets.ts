'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, TicketBalance } from '@/lib/types/database'

export function useTickets(userId: string | undefined, role: 'teacher' | 'guardian' | 'student') {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [balances, setBalances] = useState<TicketBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!userId) {
            setTickets([])
            setBalances([])
            setLoading(false)
            return
        }

        let mounted = true
        async function fetchData() {
            try {
                setLoading(true)
                setError(null)

                if (role === 'teacher') {
                    const { data, error: tErr } = await supabase
                        .from('tickets')
                        .select('*')
                        .eq('teacher_id', userId)
                        .order('created_at', { ascending: false })
                    if (tErr) throw tErr
                    if (mounted) setTickets(data || [])
                } else if (role === 'guardian') {
                    // Get available tickets
                    const { data: available, error: tErr } = await supabase
                        .from('tickets')
                        .select('*')
                        .eq('is_active', true)
                    if (tErr) throw tErr
                    if (mounted) setTickets(available || [])

                    // Get balances for students
                    const { data: students, error: sErr } = await supabase
                        .from('students')
                        .select('id')
                        .eq('guardian_id', userId)
                    if (sErr) throw sErr
                    const studentIds = (students || []).map(s => s.id)

                    if (studentIds.length > 0) {
                        const { data: b, error: bErr } = await supabase
                            .from('ticket_balances')
                            .select('*, tickets(name)')
                            .in('student_id', studentIds)
                        if (bErr) throw bErr
                        if (mounted) setBalances(b || [])
                    }
                }

            } catch (e: any) {
                if (mounted) setError(e.message || String(e))
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchData()
        return () => { mounted = false }
    }, [userId, role, supabase])

    return { tickets, balances, loading, error }
}
