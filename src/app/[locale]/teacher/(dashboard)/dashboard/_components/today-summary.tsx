"use client"

import { BookOpen, Clock, Coins } from 'lucide-react'
import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TodaySummaryProps {
  greeting: string
  todayCount: number
  completedTodayCount: number
  nextLesson: Booking | null
  studentNames: Record<string, string>
  todayEstimatedIncome: number
  loading: boolean
}

export function TodaySummary({
  greeting,
  todayCount,
  completedTodayCount,
  nextLesson,
  studentNames,
  todayEstimatedIncome,
  loading,
}: TodaySummaryProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-900 dark:to-brand-800 p-6 sm:p-8 animate-pulse h-28 sm:h-32" />
    )
  }

  const nextLessonText = nextLesson
    ? t('nextLessonAt', {
        time: format(new Date(nextLesson.start_time), 'HH:mm'),
        name: studentNames[nextLesson.student_id] || tc('student'),
      })
    : t('noNextLesson')

  const incomeFormatted = `\u00a5${Math.round(todayEstimatedIncome).toLocaleString('ja-JP')}`

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-900 dark:to-brand-800 p-5 sm:p-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-56 h-28 bg-accent-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">
          {greeting}
        </h1>

        <div className="flex flex-wrap gap-3 sm:gap-5">
          {/* Today's lessons */}
          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
            <BookOpen className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white font-medium">
              {t('todayLessons')}
            </span>
            <span className="text-sm text-white/90">
              {todayCount > 0
                ? t('todayCompleted', { completed: completedTodayCount, total: todayCount })
                : t('todayNoLessons')}
            </span>
          </div>

          {/* Next lesson */}
          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/90">
              {nextLessonText}
            </span>
          </div>

          {/* Today's estimated income */}
          {todayEstimatedIncome > 0 && (
            <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
              <Coins className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white font-medium">
                {t('todayEstimatedIncome')}
              </span>
              <span className="text-sm text-white/90">
                {incomeFormatted}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
