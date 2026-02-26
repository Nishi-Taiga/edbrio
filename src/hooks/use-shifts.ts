'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shift } from '@/lib/types/database'
import { RRule } from 'rrule'

export function useShifts(teacherId: string | undefined) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchShifts = useCallback(async () => {
    if (!teacherId) { setShifts([]); setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('shifts')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('start_time', { ascending: true })
        .limit(200)
      if (err) throw err
      setShifts(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [teacherId, supabase])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const createShift = async (params: {
    startTime: string
    endTime: string
    rrule?: string
    location?: string
  }) => {
    if (!teacherId) throw new Error('Not authenticated')
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('shifts')
        .insert({
          teacher_id: teacherId,
          start_time: params.startTime,
          end_time: params.endTime,
          rrule: params.rrule || null,
          location: params.location || null,
          is_published: true,
        })
        .select()
        .single()
      if (err) throw err

      // Expand shift into availability slots
      await expandShiftToAvailability(data)
      await fetchShifts()
      return data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw new Error(msg)
    }
  }

  const deleteShift = async (shiftId: string) => {
    setError(null)
    try {
      // Delete related availability slots that are still bookable
      await supabase
        .from('availability')
        .delete()
        .eq('source', `shift:${shiftId}`)
        .eq('is_bookable', true)

      const { error: err } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)
      if (err) throw err

      await fetchShifts()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw new Error(msg)
    }
  }

  const expandShiftToAvailability = async (shift: Shift) => {
    const slots: { teacher_id: string; slot_start: string; slot_end: string; source: string; is_bookable: boolean }[] = []
    const source = `shift:${shift.id}`

    if (shift.rrule) {
      // Parse rrule and generate occurrences for 4 weeks
      const baseStart = new Date(shift.start_time)
      const baseEnd = new Date(shift.end_time)
      const durationMs = baseEnd.getTime() - baseStart.getTime()

      const rule = RRule.fromString(shift.rrule)
      const now = new Date()
      const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

      const occurrences = rule.between(now, fourWeeksLater, true)

      for (const occ of occurrences) {
        // Preserve the time from the original shift
        const slotStart = new Date(occ)
        slotStart.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0)
        const slotEnd = new Date(slotStart.getTime() + durationMs)

        slots.push({
          teacher_id: shift.teacher_id,
          slot_start: slotStart.toISOString(),
          slot_end: slotEnd.toISOString(),
          source,
          is_bookable: true,
        })
      }
    } else {
      // Single occurrence
      slots.push({
        teacher_id: shift.teacher_id,
        slot_start: shift.start_time,
        slot_end: shift.end_time,
        source,
        is_bookable: true,
      })
    }

    if (slots.length > 0) {
      const { error: err } = await supabase.from('availability').insert(slots)
      if (err) throw err
    }
  }

  return { shifts, loading, error, createShift, deleteShift, refresh: fetchShifts }
}
