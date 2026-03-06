'use client'

import { ProtectedRoute } from '@/components/layout/protected-route'
import { ChatLayout } from '@/components/chat/chat-layout'

export default function GuardianChatPage() {
  return (
    <ProtectedRoute requiredRole="guardian">
      <ChatLayout role="guardian" />
    </ProtectedRoute>
  )
}
