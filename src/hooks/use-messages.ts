'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/types/database'

const PAGE_SIZE = 50

export function useMessages(conversationId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const offsetRef = useRef(0)

  const fetchMessages = useCallback(async (reset = true) => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }
    try {
      if (reset) {
        setLoading(true)
        offsetRef.current = 0
      }
      setError(null)

      const { data, error: mErr } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1)
      if (mErr) throw mErr

      const sorted = (data || []).reverse()
      if (reset) {
        setMessages(sorted)
      } else {
        setMessages(prev => [...sorted, ...prev])
      }
      setHasMore((data || []).length === PAGE_SIZE)
      offsetRef.current += (data || []).length
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [conversationId, supabase])

  useEffect(() => {
    fetchMessages(true)
  }, [fetchMessages])

  // Mark unread messages as read
  useEffect(() => {
    if (!conversationId || !userId || messages.length === 0) return

    const unreadIds = messages
      .filter(m => !m.is_read && m.sender_id !== userId)
      .map(m => m.id)

    if (unreadIds.length === 0) return

    supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadIds)
      .then()
  }, [conversationId, userId, messages, supabase])

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  const sendMessage = async (content: string, imageFile?: File) => {
    if (!conversationId || !userId) throw new Error('Not ready')
    try {
      setError(null)

      let imageUrl: string | undefined
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg'
        const path = `${conversationId}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('chat-images')
          .upload(path, imageFile, { contentType: imageFile.type })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      const { error: mErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content || null,
          image_url: imageUrl || null,
        })
      if (mErr) throw mErr

      // Fire-and-forget email notification
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_chat_message', data: { conversationId } }),
      }).catch(() => {})
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw new Error(msg)
    }
  }

  const loadMore = () => fetchMessages(false)

  return { messages, loading, error, hasMore, sendMessage, loadMore, refresh: () => fetchMessages(true) }
}
