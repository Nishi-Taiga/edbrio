'use client'

import { useTranslations } from 'next-intl'
import { ConversationWithDetails } from '@/hooks/use-conversations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return '昨日'
  if (diffDays < 7) return `${diffDays}日前`
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  selectedId?: string
  onSelect: (id: string) => void
  onNewConversation?: () => void
  role: 'teacher' | 'guardian'
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  role,
}: ConversationListProps) {
  const t = useTranslations('chat')

  if (conversations.length === 0 && !onNewConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>{t('noConversations')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {role === 'teacher' && onNewConversation && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <Button onClick={onNewConversation} size="sm" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            {t('newConversation')}
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>{t('noConversations')}</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={classNames(
                'w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors',
                selectedId === conv.id
                  ? 'bg-brand-50 dark:bg-brand-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {conv.student_name}
                    </span>
                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {conv.partner_name}
                  </p>
                  {conv.last_message_preview && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                      {conv.last_message_preview}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
