"use client"

import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, FileText, Clock, Flag, Mail } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { useTranslations } from 'next-intl'

interface TaskPanelProps {
  loading: boolean
  needsReportBookings: Booking[]
  pendingBookings: Booking[]
  issueReportCount: number
  unreadCount: number
  studentNames: Record<string, string>
  isUpdating: string | null
  onStatusUpdate: (id: string, status: 'confirmed' | 'canceled') => void
}

export function TaskPanel({
  loading,
  needsReportBookings,
  pendingBookings,
  issueReportCount,
  unreadCount,
  studentNames,
  isUpdating,
  onStatusUpdate,
}: TaskPanelProps) {
  const t = useTranslations('teacherDashboard')

  const allTasksDone =
    needsReportBookings.length === 0 &&
    pendingBookings.length === 0 &&
    issueReportCount === 0 &&
    unreadCount === 0

  return (
    <div
      className="h-full rounded-2xl border border-[#D4BEE4] dark:border-[#6D5A8A] p-6 flex flex-col gap-4 overflow-hidden"
      style={{
        background: 'var(--task-panel-bg)',
      }}
    >
      <style>{`
        :root { --task-panel-bg: linear-gradient(180deg, #EDE8F5 0%, #FFFFFF 100%); }
        .dark { --task-panel-bg: linear-gradient(180deg, #282237 0%, #1E1A2B 100%); }
      `}</style>
      <h2 className="text-lg font-extrabold text-gray-800 dark:text-[#E8E4F0]">{t('tasksTitle')}</h2>

      {loading ? (
        <SkeletonList count={4} />
      ) : allTasksDone ? (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-[#6D5A8A]">{t('tasksAllDone')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {/* Task: Reports */}
          {needsReportBookings.length > 0 && (
            <Link href="/teacher/reports/new" className="block">
              <div className="flex rounded-xl border border-[#FEE2E2] dark:border-[#4A2020] bg-white dark:bg-[#1E1A2B] overflow-hidden">
                <div className="w-1 shrink-0 bg-[#EF4444]" />
                <div className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-[#EF4444] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-[#E8E4F0]">{t('needsReportTitle')}</span>
                      <Badge className="bg-[#EF4444] hover:bg-[#EF4444] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">
                        {needsReportBookings.length}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-[#6D5A8A] truncate">{t('needsReportDesc') || '期限切れのレポートがあります'}</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Task: Pending Approvals */}
          {pendingBookings.length > 0 && (
            <div className="flex rounded-xl border border-[#FEF3C7] dark:border-[#4A3D1A] bg-white dark:bg-[#1E1A2B] overflow-hidden">
              <div className="w-1 shrink-0 bg-[#F59E0B]" />
              <div className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0">
                <Clock className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-[#E8E4F0]">{t('pendingBookingsTitle')}</span>
                    <Badge className="bg-[#F59E0B] hover:bg-[#F59E0B] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">
                      {pendingBookings.length}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-[#6D5A8A] truncate">{t('pendingBookingsDesc') || '新しい予約リクエストがあります'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 shrink-0">
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
                <div className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                  <Mail className="w-5 h-5 text-[#3B82F6] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-[#E8E4F0]">{t('unreadMessagesTitle')}</span>
                      <Badge className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] rounded-full">
                        {unreadCount}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-[#6D5A8A] truncate">{t('unreadMessagesDesc') || '生徒からのメッセージがあります'}</p>
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
