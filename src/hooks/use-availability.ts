'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Availability } from '@/lib/types/database'

export function useAvailability(teacherId: string | undefined, dateRange?: { start: Date; end: Date }) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const startISO = dateRange?.start.toISOString()
  const endISO = dateRange?.end.toISOString()

  const fetchAvailability = useCallback(async () => {
    if (!teacherId) { setAvailability([]); setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      let query = supabase
        .from('availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('slot_start', { ascending: true })

      if (startISO) query = query.gte('slot_start', startISO)
      if (endISO) query = query.lte('slot_start', endISO)

      const { data, error: err } = await query.limit(500)
      if (err) throw err
      setAvailability(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [teacherId, startISO, endISO, supabase])

  useEffect(() => { fetchAvailability() }, [fetchAvailability])

  return { availability, loading, error, refresh: fetchAvailability }
}
