'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HandoverNote } from '@/lib/types/database'

export function useHandoverNotes(profileId: string | undefined) {
  const [notes, setNotes] = useState<HandoverNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchNotes = useCallback(async () => {
    if (!profileId) { setNotes([]); setLoading(false); return }
    try {
      setLoading(true); setError(null)
      const { data, error: err } = await supabase
        .from('handover_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
      if (err) throw err
      setNotes(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [profileId, supabase])

  useEffect(() => {
    let mounted = true
    fetchNotes().then(() => { if (!mounted) return })
    return () => { mounted = false }
  }, [fetchNotes])

  const addNote = async (note: { content: string; to_teacher_id?: string | null }) => {
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user?.id
    if (!uid || !profileId) return
    const { error: err } = await supabase.from('handover_notes').insert({
      profile_id: profileId,
      from_teacher_id: uid,
      to_teacher_id: note.to_teacher_id || null,
      content: note.content,
    })
    if (err) throw err
    await fetchNotes()
  }

  const deleteNote = async (id: string) => {
    const { error: err } = await supabase.from('handover_notes').delete().eq('id', id)
    if (err) throw err
    await fetchNotes()
  }

  return { notes, loading, error, addNote, deleteNote, refresh: fetchNotes }
}
