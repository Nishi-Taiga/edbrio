"use client"

import { useState } from 'react'
import { ChevronUp, FileText, Clock, Mail } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface Props {
  loading: boolean
  needsReportBookings: Booking[]
  pendingBookings: Booking[]
  unreadCount: number
  studentNames: Record<string, string>
  isUpdating: string | null
  onStatusUpdate: (id: string, status: 'confirmed' | 'canceled') => void
}

export function MobileTasksCard({
  loading, needsReportBookings, pendingBookings, unreadCount,
  studentNames, isUpdating, onStatusUpdate,
}: Props) {
  const t = useTranslations('teacherDashboard')
  const [expanded, setExpanded] = useState(true)

  const totalTasks = needsReportBookings.length + pendingBookings.length + (unreadCount > 0 ? 1 : 0)

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] p-4 animate-pulse space-y-3">
        <div className="h-5 w-28 bg-gray-100 dark:bg-[#282237] rounded" />
        <div className="h-16 bg-gray-100 dark:bg-[#282237] rounded-xl" />
      </div>
    )
  }

  if (totalTasks === 0) return null

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-extrabold text-[#1E1E2E] dark:text-[#E8E4F0]">
            {t('tasksTitle')}
          </h3>
          <span className="bg-[#EF4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center">
            {totalTasks}
          </span>
        </div>
        <ChevronUp className={`w-5 h-5 text-[#6B7280] dark:text-[#6D5A8A] transition-transform ${expanded ? '' : 'rotate-180'}`} />
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Reports */}
          {needsReportBookings.length > 0 && (
            <Link href="/teacher/reports/new" className="block">
              <div className="flex rounded-xl bg-white dark:bg-[#1E1A2B] border border-[#FEE2E2] dark:border-[#4A2020] overflow-hidden">
                <div className="w-1 shrink-0 bg-[#EF4444]" />
                <div className="flex items-center gap-2.5 px-3.5 py-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-[#EF4444] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#1E1E2E] dark:text-[#E8E4F0]">
                        {t('needsReportTitle')}
                      </span>
                      <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] dark:bg-[#2E1A1A] rounded-lg px-1.5 py-0.5">
                        {needsReportBookings.length}件
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] dark:text-[#6D5A8A]">
                      {t('needsReportDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Approvals */}
          {pendingBookings.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-[#1E1A2B] border border-[#FEF3C7] dark:border-[#4A3D1A] overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0 bg-[#F59E0B]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                    <Clock className="w-5 h-5 text-[#F59E0B] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#1E1E2E] dark:text-[#E8E4F0]">
                          {t('pendingBookingsTitle')}
                        </span>
                        <span className="text-[11px] font-bold text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#4A3D1A] rounded-lg px-1.5 py-0.5">
                          {pendingBookings.length}件
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] dark:text-[#6D5A8A] truncate">
                        {studentNames[pendingBookings[0]?.student_id] || ''}さんの予約を確認
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 px-3.5 pb-2.5 pl-12">
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
            </div>
          )}

          {/* Messages */}
          {unreadCount > 0 && (
            <Link href="/teacher/chat" className="block">
              <div className="flex rounded-xl bg-white dark:bg-[#1E1A2B] border border-[#DBEAFE] dark:border-[#1A2A4A] overflow-hidden">
                <div className="w-1 shrink-0 bg-[#3B82F6]" />
                <div className="flex items-center gap-2.5 px-3.5 py-3 flex-1 min-w-0">
                  <Mail className="w-5 h-5 text-[#3B82F6] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#1E1E2E] dark:text-[#E8E4F0]">
                        {t('unreadMessagesTitle')}
                      </span>
                      <span className="text-[11px] font-bold text-[#3B82F6] bg-[#EFF6FF] dark:bg-[#1E2A40] rounded-lg px-1.5 py-0.5">
                        {unreadCount}件
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] dark:text-[#6D5A8A]">
                      {t('unreadMessagesDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
