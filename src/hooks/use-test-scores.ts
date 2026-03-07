'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TestScore } from '@/lib/types/database'

export function useTestScores(profileId: string | undefined) {
  const [scores, setScores] = useState<TestScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    if (!profileId) {
      setScores([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const scoresRes = await supabase
        .from('test_scores')
        .select('*')
        .eq('profile_id', profileId)
        .order('test_date', { ascending: false })
      if (scoresRes.error) throw scoresRes.error
      setScores(scoresRes.data || [])
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

  // Scores CRUD
  const addScore = async (score: Omit<TestScore, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    const { error: err } = await supabase
      .from('test_scores')
      .insert({ ...score, profile_id: profileId })
    if (err) throw err
    await fetchAll()
  }

  const updateScore = async (id: string, updates: Partial<TestScore>) => {
    const { error: err } = await supabase
      .from('test_scores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  const deleteScore = async (id: string) => {
    const { error: err } = await supabase.from('test_scores').delete().eq('id', id)
    if (err) throw err
    await fetchAll()
  }

  return {
    scores, loading, error,
    addScore, updateScore, deleteScore,
    refresh: fetchAll,
  }
}
