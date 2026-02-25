'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudentGoal, StudentWeakPoint, StudentStrength } from '@/lib/types/database'

export function useStudentKarte(profileId: string | undefined) {
  const [goals, setGoals] = useState<StudentGoal[]>([])
  const [weakPoints, setWeakPoints] = useState<StudentWeakPoint[]>([])
  const [strengths, setStrengths] = useState<StudentStrength[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setGoals([]); setWeakPoints([]); setStrengths([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const [goalsRes, wpRes, strRes] = await Promise.all([
        supabase.from('student_goals').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
        supabase.from('student_weak_points').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
        supabase.from('student_strengths').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
      ])
      if (goalsRes.error) throw goalsRes.error
      if (wpRes.error) throw wpRes.error
      if (strRes.error) throw strRes.error
      setGoals(goalsRes.data || [])
      setWeakPoints(wpRes.data || [])
      setStrengths(strRes.data || [])
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

  // Goals CRUD
  const addGoal = async (goal: Omit<StudentGoal, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('student_goals')
      .insert({ ...goal, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateGoal = async (id: string, updates: Partial<StudentGoal>) => {
    const { error: err } = await supabase
      .from('student_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteGoal = async (id: string) => {
    const { error: err } = await supabase.from('student_goals').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  // Weak Points CRUD
  const addWeakPoint = async (wp: Omit<StudentWeakPoint, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('student_weak_points')
      .insert({ ...wp, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateWeakPoint = async (id: string, updates: Partial<StudentWeakPoint>) => {
    const { error: err } = await supabase
      .from('student_weak_points')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteWeakPoint = async (id: string) => {
    const { error: err } = await supabase.from('student_weak_points').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  // Strengths CRUD
  const addStrength = async (s: Omit<StudentStrength, 'id' | 'profile_id' | 'created_at'>) => {
    const { error: err } = await supabase
      .from('student_strengths')
      .insert({ ...s, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const deleteStrength = async (id: string) => {
    const { error: err } = await supabase.from('student_strengths').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  return {
    goals, weakPoints, strengths, loading, error,
    addGoal, updateGoal, deleteGoal,
    addWeakPoint, updateWeakPoint, deleteWeakPoint,
    addStrength, deleteStrength,
    refresh: fetchAll,
  }
}
