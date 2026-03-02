'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Conversation } from '@/lib/types/database'

export interface ConversationWithDetails extends Conversation {
  student_name: string
  partner_name: string
  last_message_preview?: string
  unread_count: number
}

export function useConversations(userId: string | undefined, role: 'teacher' | 'guardian') {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const column = role === 'teacher' ? 'teacher_id' : 'guardian_id'
      const { data: convs, error: cErr } = await supabase
        .from('conversations')
        .select('*')
        .eq(column, userId)
        .order('last_message_at', { ascending: false })
      if (cErr) throw cErr
      if (!convs || convs.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Fetch student profile names
      const profileIds = [...new Set(convs.map(c => c.student_profile_id))]
      const { data: profiles } = await supabase
        .from('student_profiles')
        .select('id, name')
        .in('id', profileIds)
      const profileMap = new Map((profiles || []).map(p => [p.id, p.name]))

      // Fetch partner user names
      const partnerIds = [...new Set(convs.map(c => role === 'teacher' ? c.guardian_id : c.teacher_id))]
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', partnerIds)
      const userMap = new Map((users || []).map(u => [u.id, u.name]))

      // Fetch last message for each conversation
      const convIds = convs.map(c => c.id)
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, image_url')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })

      const lastMsgMap = new Map<string, string>()
      for (const msg of lastMessages || []) {
        if (!lastMsgMap.has(msg.conversation_id)) {
          lastMsgMap.set(msg.conversation_id, msg.content || (msg.image_url ? '📷 画像' : ''))
        }
      }

      // Fetch unread counts
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('is_read', false)
        .neq('sender_id', userId)

      const unreadMap = new Map<string, number>()
      for (const msg of unreadData || []) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1)
      }

      const result: ConversationWithDetails[] = convs.map(c => ({
        ...c,
        student_name: profileMap.get(c.student_profile_id) || '',
        partner_name: userMap.get(role === 'teacher' ? c.guardian_id : c.teacher_id) || '',
        last_message_preview: lastMsgMap.get(c.id),
        unread_count: unreadMap.get(c.id) || 0,
      }))

      setConversations(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [userId, role, supabase])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => { fetchConversations() }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchConversations() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchConversations])

  const createConversation = async (guardianId: string, studentProfileId: string) => {
    try {
      setError(null)
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('teacher_id', userId!)
        .eq('guardian_id', guardianId)
        .eq('student_profile_id', studentProfileId)
        .maybeSingle()

      if (existing) return existing.id

      const { data, error: cErr } = await supabase
        .from('conversations')
        .insert({ teacher_id: userId!, guardian_id: guardianId, student_profile_id: studentProfileId })
        .select()
        .single()
      if (cErr) throw cErr

      await fetchConversations()
      return data.id as string
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw new Error(msg)
    }
  }

  return { conversations, loading, error, createConversation, refresh: fetchConversations }
}
