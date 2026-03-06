'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { useMessages } from '@/hooks/use-messages'
import { ConversationList } from './conversation-list'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft } from 'lucide-react'

interface ChatLayoutProps {
  role: 'teacher' | 'guardian'
}

export function ChatLayout({ role }: ChatLayoutProps) {
  const t = useTranslations('chat')
  const { user } = useAuth()
  const { conversations, loading: convsLoading, createConversation } = useConversations(user?.id, role)
  const [selectedConvId, setSelectedConvId] = useState<string | undefined>()
  const { messages, loading: msgsLoading, hasMore, sendMessage, loadMore } = useMessages(selectedConvId, user?.id)

  // New conversation dialog (teacher only)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [profiles, setProfiles] = useState<{ id: string; name: string; guardian_id: string | null; guardian_name?: string }[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Mobile: show message view when conversation selected
  const [mobileView, setMobileView] = useState<'list' | 'messages'>('list')

  const handleSelectConv = (id: string) => {
    setSelectedConvId(id)
    setMobileView('messages')
  }

  const handleBack = () => {
    setMobileView('list')
    setSelectedConvId(undefined)
  }

  const selectedConv = conversations.find(c => c.id === selectedConvId)

  // Fetch student profiles with guardians for new conversation dialog
  const fetchProfilesForNewConv = useCallback(async () => {
    if (!user?.id) return
    setProfilesLoading(true)
    try {
      const { data } = await supabase
        .from('student_profiles')
        .select('id, name, guardian_id')
        .eq('teacher_id', user.id)
        .not('guardian_id', 'is', null)

      if (!data || data.length === 0) {
        setProfiles([])
        return
      }

      // Get guardian names
      const guardianIds = [...new Set(data.map(p => p.guardian_id).filter(Boolean))] as string[]
      const { data: guardianUsers } = await supabase
        .from('users')
        .select('id, name')
        .in('id', guardianIds)
      const nameMap = new Map((guardianUsers || []).map(u => [u.id, u.name]))

      // Filter out profiles that already have conversations
      const existingKeys = new Set(
        conversations.map(c => `${c.teacher_id}-${c.guardian_id}-${c.student_profile_id}`)
      )

      const available = data
        .filter(p => p.guardian_id && !existingKeys.has(`${user.id}-${p.guardian_id}-${p.id}`))
        .map(p => ({
          id: p.id,
          name: p.name,
          guardian_id: p.guardian_id,
          guardian_name: p.guardian_id ? nameMap.get(p.guardian_id) : undefined,
        }))

      setProfiles(available)
    } finally {
      setProfilesLoading(false)
    }
  }, [user?.id, supabase, conversations])

  const handleOpenNewDialog = () => {
    setShowNewDialog(true)
    fetchProfilesForNewConv()
  }

  const handleCreateConversation = async (profileId: string, guardianId: string) => {
    const convId = await createConversation(guardianId, profileId)
    setShowNewDialog(false)
    setSelectedConvId(convId)
    setMobileView('messages')
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      {/* Conversation list - desktop always visible, mobile conditional */}
      <div className={`w-full md:w-80 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 ${mobileView === 'messages' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t('title')}</h2>
        </div>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConvId}
          onSelect={handleSelectConv}
          onNewConversation={role === 'teacher' ? handleOpenNewDialog : undefined}
          role={role}
        />
      </div>

      {/* Message view */}
      <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {selectedConvId && selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <Button variant="ghost" size="sm" onClick={handleBack} className="md:hidden p-1">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {selectedConv.student_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedConv.partner_name}
                </p>
              </div>
            </div>

            <MessageList
              messages={messages}
              currentUserId={user!.id}
              loading={msgsLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
            <MessageInput onSend={sendMessage} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
            {convsLoading ? t('loading') : t('selectConversation')}
          </div>
        )}
      </div>

      {/* New conversation dialog (teacher only) */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('newConversation')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {profilesLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">{t('loading')}</p>
            ) : profiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">{t('noProfilesAvailable')}</p>
            ) : (
              profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleCreateConversation(p.id, p.guardian_id!)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('guardian')}: {p.guardian_name || '-'}
                  </p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
