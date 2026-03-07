'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LessonLog, LessonLogPhase } from '@/lib/types/database'

export function useLessonLogs(profileId: string | undefined) {
  const [logs, setLogs] = useState<LessonLog[]>([])
  const [logPhases, setLogPhases] = useState<LessonLogPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setLogs([]); setLogPhases([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const logsRes = await supabase
        .from('lesson_logs')
        .select('*')
        .eq('profile_id', profileId)
        .order('lesson_date', { ascending: false })
      if (logsRes.error) throw logsRes.error
      const fetchedLogs = logsRes.data || []
      setLogs(fetchedLogs)

      if (fetchedLogs.length > 0) {
        const logIds = fetchedLogs.map((l) => l.id)
        const logPhasesRes = await supabase
          .from('lesson_log_phases')
          .select('*')
          .in('lesson_log_id', logIds)
          .order('created_at', { ascending: true })
        if (logPhasesRes.error) throw logPhasesRes.error
        setLogPhases(logPhasesRes.data || [])
      } else {
        setLogPhases([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [profileId, supabase])

  useEffect(() => {
    let mounted = true
    fetchAll().then(() => { if (!mounted) return })
    return () => { mounted = false }
  }, [fetchAll])

  // Logs CRUD
  const addLog = async (
    log: Omit<LessonLog, 'id' | 'profile_id' | 'created_at' | 'updated_at'>,
    phaseIds?: string[]
  ) => {
    const { data, error: err } = await supabase
      .from('lesson_logs')
      .insert({ ...log, profile_id: profileId })
      .select('id')
      .single()
    if (err) throw err

    if (phaseIds && phaseIds.length > 0 && data) {
      const logPhaseRows = phaseIds.map((phaseId) => ({
        lesson_log_id: data.id,
        phase_id: phaseId,
      }))
      const { error: phaseErr } = await supabase
        .from('lesson_log_phases')
        .insert(logPhaseRows)
      if (phaseErr) throw phaseErr
    }

    await fetchAll()
  }

  const updateLog = async (id: string, updates: Partial<LessonLog>) => {
    const { error: err } = await supabase
      .from('lesson_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteLog = async (id: string) => {
    const { error: err } = await supabase.from('lesson_logs').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  return {
    logs, logPhases, loading, error,
    addLog, updateLog, deleteLog,
    refresh: fetchAll,
  }
}
