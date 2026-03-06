"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, FileText, Clock, Flag, Mail, ChevronUp } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { useTranslations } from 'next-intl'

interface ResponsiveTasksProps {
  loading: boolean
  needsReportBookings: Booking[]
  pendingBookings: Booking[]
  issueReportCount: number
  unreadCount: number
  studentNames: Record<string, string>
  isUpdating: string | null
  onStatusUpdate: (id: string, status: 'confirmed' | 'canceled') => void
}

export function ResponsiveTasks({
  loading,
  needsReportBookings,
  pendingBookings,
  issueReportCount,
  unreadCount,
  studentNames,
  isUpdating,
  onStatusUpdate,
}: ResponsiveTasksProps) {
  const t = useTranslations('teacherDashboard')
  const [expanded, setExpanded] = useState(true)

  const allTasksDone =
    needsReportBookings.length === 0 &&
    pendingBookings.length === 0 &&
    issueReportCount === 0 &&
    unreadCount === 0

  const totalTasks = needsReportBookings.length + pendingBookings.length +
    (issueReportCount > 0 ? 1 : 0) + (unreadCount > 0 ? 1 : 0)

  return (
    <div
      className="h-full rounded-2xl border border-[#E5E0D8] md:border-[#D4BEE4] dark:border-[#2E2840] md:dark:border-[#6D5A8A] p-4 md:p-6 flex flex-col gap-3 md:gap-4 overflow-hidden bg-white dark:bg-[#1E1A2B] md:bg-none"
      style={{
        background: undefined,
      }}
    >
      {/* Desktop gradient background */}
      <style>{`
        @media (min-width: 768px) {
          .responsive-tasks-panel { background: var(--task-panel-bg) !important; }
        }
        :root { --task-panel-bg: linear-gradient(180deg, #EDE8F5 0%, #FFFFFF 100%); }
        .dark { --task-panel-bg: linear-gradient(180deg, #282237 0%, #1E1A2B 100%); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base md:text-lg font-extrabold text-[#1E1E2E] md:text-gray-800 dark:text-[#E8E4F0]">{t('tasksTitle')}</h2>
          {/* Mobile: red count badge */}
          {totalTasks > 0 && (
            <span className="md:hidden bg-[#EF4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center">
              {totalTasks}
            </span>
          )}
        </div>
        {/* Mobile-only collapse button */}
        <button onClick={() => setExpanded(!expanded)} className="md:hidden">
          <ChevronUp className={`w-5 h-5 text-[#6B7280] dark:text-[#6D5A8A] transition-transform ${expanded ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : allTasksDone ? (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-[#6D5A8A]">{t('tasksAllDone')}</p>
        </div>
      ) : (
        /* Task list: always visible on md+, collapsible on mobile */
        <div className={`flex flex-col gap-3 md:gap-4 flex-1 ${expanded ? '' : 'hidden'} md:!flex`}>
          {/* Task: Reports */}
          {needsReportBookings.length > 0 && (
            <Link href="/teacher/reports/new" className="block">
              <div className="flex rounded-xl border border-[#FEE2E2] dark:border-[#4A2020] bg-white dark:bg-[#1E1A2B] overflow-hidden">
                <div className="w-1 shrink-0 bg-[#EF4444]" />
                <div className="flex items-center gap-2.5 md:gap-3 px-3.5 md:px-3 py-3 md:py-2.5 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-[#EF4444] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-sm font-bold md:font-semibold text-[#1E1E2E] md:text-gray-800 dark:text-[#E8E4F0]">{t('needsReportTitle')}</span>
                      <Badge className="bg-[#EF4444] hover:bg-[#EF4444] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">
                        {needsReportBookings.length}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-[11px] text-[#6B7280] md:text-gray-500 dark:text-[#6D5A8A] truncate">{t('needsReportDesc') || '期限切れのレポートがあります'}</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Task: Pending Approvals */}
          {pendingBookings.length > 0 && (
            <div className="flex rounded-xl border border-[#FEF3C7] dark:border-[#4A3D1A] bg-white dark:bg-[#1E1A2B] overflow-hidden">
              <div className="w-1 shrink-0 bg-[#F59E0B]" />
              <div className="flex-1">
                <div className="flex items-center gap-2.5 md:gap-3 px-3.5 md:px-3 py-2.5 md:py-2">
                  <Clock className="w-5 h-5 text-[#F59E0B] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-sm font-bold md:font-semibold text-[#1E1E2E] md:text-gray-800 dark:text-[#E8E4F0]">{t('pendingBookingsTitle')}</span>
                      <Badge className="bg-[#F59E0B] hover:bg-[#F59E0B] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">
                        {pendingBookings.length}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-[10px] text-[#6B7280] md:text-gray-500 dark:text-[#6D5A8A] truncate">
                      {t('pendingConfirmDesc', { name: studentNames[pendingBookings[0]?.student_id] || '' })}
                    </p>
                  </div>
                  {/* Desktop: inline buttons */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <button
                      className="rounded-lg bg-[#10B981] text-white text-[11px] font-semibold px-2.5 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                      onClick={() => pendingBookings[0] && onStatusUpdate(pendingBookings[0].id, 'confirmed')}
                      disabled={isUpdating === pendingBookings[0]?.id}
                    >
                      {t('approveButton') || '承認'}
                    </button>
                    <button
                      className="rounded-lg border border-gray-200 dark:border-[#2E2840] text-gray-500 dark:text-[#6D5A8A] text-[11px] font-semibold px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-[#282237] transition-colors disabled:opacity-50"
                      onClick={() => pendingBookings[0] && onStatusUpdate(pendingBookings[0].id, 'canceled')}
                      disabled={isUpdating === pendingBookings[0]?.id}
                    >
                      {t('rejectButton') || '拒否'}
                    </button>
                  </div>
                </div>
                {/* Mobile: stacked buttons */}
                <div className="flex md:hidden gap-2 px-3.5 pb-2.5 pl-12">
                  <button
                    onClick={() => pendingBookings[0] && onStatusUpdate(pendingBookings[0].id, 'confirmed')}
                    disabled={isUpdating === pendingBookings[0]?.id}
                    className="flex-1 rounded-lg bg-[#10B981] text-white text-[13px] font-bold py-2 text-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {t('approveButton')}
                  </button>
                  <button
                    onClick={() => pendingBookings[0] && onStatusUpdate(pendingBookings[0].id, 'canceled')}
                    disabled={isUpdating === pendingBookings[0]?.id}
                    className="flex-1 rounded-lg bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] text-[#6B7280] dark:text-[#6D5A8A] text-[13px] font-semibold py-2 text-center hover:bg-gray-50 dark:hover:bg-[#282237] transition-colors disabled:opacity-50"
                  >
                    {t('rejectButton')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task: Issues */}
          <div
            className={`flex rounded-xl border px-4 py-3.5 items-center gap-3 ${
              issueReportCount > 0
                ? 'border-[#FED7AA] dark:border-[#4A3D1A] bg-white dark:bg-[#1E1A2B]'
                : 'border-[#E5E0D8] dark:border-[#2E2840] bg-[#F9F6F2] dark:bg-[#13111C] opacity-60'
            }`}
          >
            <Flag className={`w-5 h-5 shrink-0 ${issueReportCount > 0 ? 'text-orange-500' : 'text-gray-400 dark:text-[#6D5A8A]'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-[#E8E4F0]">{t('issueReportsTitle')}</span>
                <Badge
                  className={`text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full ${
                    issueReportCount > 0
                      ? 'bg-orange-500 hover:bg-orange-500 text-white'
                      : 'bg-gray-300 dark:bg-[#2E2840] hover:bg-gray-300 dark:hover:bg-[#2E2840] text-gray-600 dark:text-[#6D5A8A]'
                  }`}
                >
                  {issueReportCount}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-[#6D5A8A]">
                {issueReportCount > 0
                  ? (t('issueReportsDesc') || '問題報告があります')
                  : (t('issueReportsNone') || '問題報告はありません')}
              </p>
            </div>
          </div>

          {/* Task: Unread Messages */}
          {unreadCount > 0 ? (
            <Link href="/teacher/chat" className="block">
              <div className="flex rounded-xl border border-[#DBEAFE] dark:border-[#1A2A4A] bg-white dark:bg-[#1E1A2B] overflow-hidden">
                <div className="w-1 shrink-0 bg-[#3B82F6]" />
                <div className="flex items-center gap-2.5 md:gap-3 px-3.5 md:px-3 py-3 md:py-2.5 flex-1 min-w-0">
                  <Mail className="w-5 h-5 text-[#3B82F6] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-sm font-bold md:font-semibold text-[#1E1E2E] md:text-gray-800 dark:text-[#E8E4F0]">{t('unreadMessagesTitle')}</span>
                      <Badge className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">
                        {unreadCount}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-[11px] text-[#6B7280] md:text-gray-500 dark:text-[#6D5A8A] truncate">{t('unreadMessagesDesc') || '生徒からのメッセージがあります'}</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex rounded-xl border border-[#E5E0D8] dark:border-[#2E2840] bg-[#F9F6F2] dark:bg-[#1E1A2B] px-4 py-3.5 items-center gap-3 opacity-60">
              <Mail className="w-5 h-5 text-gray-400 dark:text-[#6D5A8A] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-[#E8E4F0]">{t('unreadMessagesTitle')}</span>
                  <Badge className="bg-gray-300 dark:bg-[#2E2840] hover:bg-gray-300 dark:hover:bg-[#2E2840] text-gray-600 dark:text-[#6D5A8A] text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">0</Badge>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-[#6D5A8A]">{t('unreadMessagesNone') || '未読メッセージはありません'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
