'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile } from '@/lib/types/database'

export function useStudentProfiles(teacherId: string | undefined) {
  const [profiles, setProfiles] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchProfiles = useCallback(async () => {
    if (!teacherId) {
      setProfiles([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('name')
      if (err) throw err
      setProfiles(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [teacherId, supabase])

  useEffect(() => {
    let mounted = true
    fetchProfiles().then(() => {
      if (!mounted) return
    })
    return () => { mounted = false }
  }, [fetchProfiles])

  const createProfile = async (profile: Omit<StudentProfile, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>) => {
    if (!teacherId) return null
    const { data, error: err } = await supabase
      .from('student_profiles')
      .insert({ ...profile, teacher_id: teacherId })
      .select()
      .single()
    if (err) throw err
    await fetchProfiles()
    return data
  }

  const updateProfile = async (id: string, updates: Partial<StudentProfile>) => {
    const { error: err } = await supabase
      .from('student_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchProfiles()
  }

  const deleteProfile = async (id: string) => {
    const { error: err } = await supabase
      .from('student_profiles')
      .delete()
      .eq('id', id)
    if (err) throw err
    await fetchProfiles()
  }

  return { profiles, loading, error, createProfile, updateProfile, deleteProfile, refresh: fetchProfiles }
}
