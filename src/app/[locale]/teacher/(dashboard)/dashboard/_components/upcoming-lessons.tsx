"use client"

import { Link } from '@/i18n/navigation'
import { Calendar, ArrowRight } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { format, isToday, isTomorrow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UpcomingLessonsProps {
  upcomingLessons: Booking[]
  studentNames: Record<string, string>
  loading: boolean
}

export function UpcomingLessons({ upcomingLessons, studentNames, loading }: UpcomingLessonsProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse space-y-3">
        <div className="h-4 bg-gray-100 rounded w-28" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    )
  }

  const getTimeLabel = (startTime: string) => {
    const d = new Date(startTime)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isTomorrow(d)) return '明日'
    return format(d, 'M/d', { locale: ja })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-[11px] font-bold text-[#3B82F6] bg-[#EFF6FF] rounded-md px-2 py-0.5">
            {t('statusConfirmed') || '予約'}
          </span>
        )
      case 'done':
        return (
          <span className="text-[11px] font-bold text-[#10B981] bg-[#ECFDF5] rounded-md px-2 py-0.5">
            {t('statusDone') || '完了'}
          </span>
        )
      case 'pending':
        return (
          <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] rounded-md px-2 py-0.5">
            {t('statusPending') || '未提出'}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase">{t('upcomingLessonsTitle')}</h3>

      {upcomingLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
          <Calendar className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">{t('upcomingLessonsEmpty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 flex-1">
          {upcomingLessons.map((b, i) => {
            const startDate = new Date(b.start_time)
            const timeLabel = getTimeLabel(b.start_time)
            const isTimeOnly = isToday(startDate)

            return (
              <div key={b.id}>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-sm font-bold w-10 shrink-0 ${
                        isTimeOnly ? 'text-[#7C3AED]' : 'text-gray-400'
                      }`}
                    >
                      {timeLabel}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-gray-800">
                        {studentNames[b.student_id] || tc('student')}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {isTimeOnly
                          ? format(startDate, 'HH:mm', { locale: ja })
                          : format(startDate, 'HH:mm', { locale: ja })}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(b.status)}
                </div>
                {i < upcomingLessons.length - 1 && (
                  <div className="h-px bg-[#EDE8F5]" />
                )}
              </div>
            )
          })}

          {/* More link */}
          <Link
            href="/teacher/calendar"
            className="flex items-center justify-center gap-1 py-2 mt-auto text-[#7C3AED] text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            {t('upcomingLessonsViewAll') || 'もっと見る'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
