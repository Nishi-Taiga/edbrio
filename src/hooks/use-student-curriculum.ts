'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudentGoal, CurriculumUnit, SkillAssessment } from '@/lib/types/database'

export function useStudentCurriculum(profileId: string | undefined) {
  const [goals, setGoals] = useState<StudentGoal[]>([])
  const [units, setUnits] = useState<CurriculumUnit[]>([])
  const [skills, setSkills] = useState<SkillAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setGoals([]); setUnits([]); setSkills([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const [goalsRes, unitsRes, skillsRes] = await Promise.all([
        supabase.from('student_goals').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
        supabase.from('curriculum_units').select('*').eq('profile_id', profileId).order('order_index', { ascending: true }),
        supabase.from('skill_assessments').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
      ])
      if (goalsRes.error) throw goalsRes.error
      if (unitsRes.error) throw unitsRes.error
      if (skillsRes.error) throw skillsRes.error
      setGoals(goalsRes.data || [])
      setUnits(unitsRes.data || [])
      setSkills(skillsRes.data || [])
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

  // Units CRUD
  const addUnit = async (unit: Omit<CurriculumUnit, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('curriculum_units')
      .insert({ ...unit, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateUnit = async (id: string, updates: Partial<CurriculumUnit>) => {
    const { error: err } = await supabase
      .from('curriculum_units')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteUnit = async (id: string) => {
    const { error: err } = await supabase.from('curriculum_units').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  // Skills CRUD
  const addSkill = async (skill: Omit<SkillAssessment, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('skill_assessments')
      .insert({ ...skill, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateSkill = async (id: string, updates: Partial<SkillAssessment>) => {
    const { error: err } = await supabase
      .from('skill_assessments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteSkill = async (id: string) => {
    const { error: err } = await supabase.from('skill_assessments').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  return {
    goals, units, skills, loading, error,
    addGoal, updateGoal, deleteGoal,
    addUnit, updateUnit, deleteUnit,
    addSkill, updateSkill, deleteSkill,
    refresh: fetchAll,
  }
}
