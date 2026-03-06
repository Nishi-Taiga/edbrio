'use client'

import { ProtectedRoute } from '@/components/layout/protected-route'
import { ChatLayout } from '@/components/chat/chat-layout'

export default function TeacherChatPage() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <ChatLayout role="teacher" />
    </ProtectedRoute>
  )
}
