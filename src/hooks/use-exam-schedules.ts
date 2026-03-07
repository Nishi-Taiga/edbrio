'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExamSchedule } from '@/lib/types/database'

export function useExamSchedules(profileId: string | undefined) {
  const [exams, setExams] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setExams([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const examsRes = await supabase
        .from('exam_schedules')
        .select('*')
        .eq('profile_id', profileId)
        .order('exam_date', { ascending: true })
      if (examsRes.error) throw examsRes.error
      setExams(examsRes.data || [])
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

  // Exams CRUD
  const addExam = async (exam: Omit<ExamSchedule, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('exam_schedules')
      .insert({ ...exam, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateExam = async (id: string, updates: Partial<ExamSchedule>) => {
    const { error: err } = await supabase
      .from('exam_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteExam = async (id: string) => {
    const { error: err } = await supabase.from('exam_schedules').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  return {
    exams, loading, error,
    addExam, updateExam, deleteExam,
    refresh: fetchAll,
  }
}
