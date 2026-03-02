'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(userId: string | undefined, role: 'teacher' | 'guardian') {
  const [count, setCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setCount(0)
      return
    }

    const column = role === 'teacher' ? 'teacher_id' : 'guardian_id'
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq(column, userId)

    if (!convs || convs.length === 0) {
      setCount(0)
      return
    }

    const convIds = convs.map(c => c.id)
    const { count: unread } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', userId)

    setCount(unread || 0)
  }, [userId, role, supabase])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('unread-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => { fetchCount() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchCount])

  return { count, refresh: fetchCount }
}
