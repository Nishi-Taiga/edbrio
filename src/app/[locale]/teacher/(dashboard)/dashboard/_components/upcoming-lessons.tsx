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
  studentSubjects?: Record<string, string>
  loading: boolean
}

export function UpcomingLessons({ upcomingLessons, studentNames, studentSubjects, loading }: UpcomingLessonsProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] p-6 animate-pulse space-y-3">
        <div className="h-4 bg-gray-100 dark:bg-[#282237] rounded w-28" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-[#282237] rounded" />
        ))}
      </div>
    )
  }

  const getTimeLabel = (startTime: string) => {
    const d = new Date(startTime)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isTomorrow(d)) return t('tomorrow')
    return format(d, 'M/d', { locale: ja })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-[11px] font-bold text-[#3B82F6] bg-[#EFF6FF] dark:bg-[#1E2A40] rounded-md px-2 py-0.5">
            {t('statusConfirmed')}
          </span>
        )
      case 'done':
        return (
          <span className="text-[11px] font-bold text-[#10B981] bg-[#ECFDF5] dark:bg-[#1A2E28] rounded-md px-2 py-0.5">
            {t('statusDone')}
          </span>
        )
      case 'pending':
        return (
          <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] dark:bg-[#2E1A1A] rounded-md px-2 py-0.5">
            {t('statusPending')}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] p-6 flex flex-col gap-3">
      <h3 className="text-xs font-bold text-gray-500 dark:text-[#9CA3AF] tracking-widest uppercase">{t('upcomingLessonsTitle')}</h3>

      {upcomingLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center flex-1">
          <Calendar className="w-8 h-8 text-gray-300 dark:text-[#2E2840] mb-2" />
          <p className="text-sm text-gray-400 dark:text-[#6D5A8A]">{t('upcomingLessonsEmpty')}</p>
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
                        isTimeOnly ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-gray-400 dark:text-[#6D5A8A]'
                      }`}
                    >
                      {timeLabel}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-gray-800 dark:text-[#E8E4F0]">
                        {studentNames[b.student_id] || tc('student')}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-[#6D5A8A]">
                        {studentSubjects?.[b.student_id]
                          ? `${studentSubjects[b.student_id]}・${format(startDate, 'HH:mm', { locale: ja })}`
                          : format(startDate, 'HH:mm', { locale: ja })}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(b.status)}
                </div>
                {i < upcomingLessons.length - 1 && (
                  <div className="h-px bg-[#EDE8F5] dark:bg-[#282237]" />
                )}
              </div>
            )
          })}

          {/* More link */}
          <Link
            href="/teacher/calendar"
            className="flex items-center justify-center gap-1 py-2 mt-auto text-[#7C3AED] dark:text-[#A78BFA] text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            {t('upcomingLessonsViewAll')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
