'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { ChatLayout } from '@/components/chat/chat-layout'
import { PlanGateChat } from '@/components/chat/plan-gate-chat'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { TeacherPlan } from '@/lib/types/database'

export default function TeacherChatPage() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [plan, setPlan] = useState<TeacherPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('teachers')
      .select('plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setPlan(data?.plan ?? 'free')
        setLoading(false)
      })
  }, [user?.id, supabase])

  return (
    <ProtectedRoute requiredRole="teacher">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          読み込み中...
        </div>
      ) : plan === 'standard' ? (
        <ChatLayout role="teacher" />
      ) : (
        <PlanGateChat />
      )}
    </ProtectedRoute>
  )
}
