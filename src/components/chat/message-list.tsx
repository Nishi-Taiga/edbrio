'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Message } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function formatMessageDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString()
    if (date !== currentDate) {
      currentDate = date
      groups.push({ date: msg.created_at, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }

  return groups
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function MessageList({ messages, currentUserId, loading, hasMore, onLoadMore }: MessageListProps) {
  const t = useTranslations('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  // Initial scroll to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView()
    }
  }, [])

  // Detect if user scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100)
  }

  const groups = groupMessagesByDate(messages)

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
        {t('loadingMessages')}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
        {t('noMessages')}
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {hasMore && (
          <div className="flex justify-center mb-3">
            <Button variant="ghost" size="sm" onClick={onLoadMore} className="gap-1 text-xs">
              <ChevronUp className="w-3 h-3" />
              {t('loadMore')}
            </Button>
          </div>
        )}

        {groups.map((group, gi) => (
          <div key={gi}>
            <div className="flex items-center justify-center my-4">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-0.5 rounded-full">
                {formatMessageDate(group.date)}
              </span>
            </div>
            {group.messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId
              return (
                <div
                  key={msg.id}
                  className={classNames(
                    'flex mb-2',
                    isMine ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={classNames(
                      'max-w-[75%] rounded-2xl px-3.5 py-2',
                      isMine
                        ? 'bg-brand-600 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                    )}
                  >
                    {msg.image_url && (
                      <button
                        onClick={() => setExpandedImage(msg.image_url!)}
                        className="block mb-1 rounded-lg overflow-hidden"
                      >
                        <img
                          src={msg.image_url}
                          alt=""
                          className="max-w-full max-h-48 object-cover rounded-lg"
                          loading="lazy"
                        />
                      </button>
                    )}
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <div className={classNames(
                      'text-[10px] mt-1',
                      isMine ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'
                    )}>
                      {formatMessageTime(msg.created_at)}
                      {isMine && msg.is_read && (
                        <span className="ml-1">{t('read')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  )
}
