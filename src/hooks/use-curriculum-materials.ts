'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CurriculumMaterial, CurriculumPhase } from '@/lib/types/database'

export function useCurriculumMaterials(profileId: string | undefined) {
  const [materials, setMaterials] = useState<CurriculumMaterial[]>([])
  const [phases, setPhases] = useState<CurriculumPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setMaterials([]); setPhases([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const materialsRes = await supabase
        .from('curriculum_materials')
        .select('*')
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true })
      if (materialsRes.error) throw materialsRes.error
      const fetchedMaterials = materialsRes.data || []
      setMaterials(fetchedMaterials)

      if (fetchedMaterials.length > 0) {
        const materialIds = fetchedMaterials.map((m) => m.id)
        const phasesRes = await supabase
          .from('curriculum_phases')
          .select('*')
          .in('material_id', materialIds)
          .order('order_index', { ascending: true })
        if (phasesRes.error) throw phasesRes.error
        setPhases(phasesRes.data || [])
      } else {
        setPhases([])
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

  // Materials CRUD
  const addMaterial = async (material: Omit<CurriculumMaterial, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('curriculum_materials')
      .insert({ ...material, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateMaterial = async (id: string, updates: Partial<CurriculumMaterial>) => {
    const { error: err } = await supabase
      .from('curriculum_materials')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteMaterial = async (id: string) => {
    const { error: err } = await supabase.from('curriculum_materials').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  // Phases CRUD
  const addPhase = async (phase: Omit<CurriculumPhase, 'id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('curriculum_phases')
      .insert(phase)
    if (err) throw err
    await fetchAll()
  }

  const updatePhase = async (id: string, updates: Partial<CurriculumPhase>) => {
    const { error: err } = await supabase
      .from('curriculum_phases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deletePhase = async (id: string) => {
    const { error: err } = await supabase.from('curriculum_phases').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  return {
    materials, phases, loading, error,
    addMaterial, updateMaterial, deleteMaterial,
    addPhase, updatePhase, deletePhase,
    refresh: fetchAll,
  }
}
