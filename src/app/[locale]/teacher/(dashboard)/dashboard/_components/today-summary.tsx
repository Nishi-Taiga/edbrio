"use client"

import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

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
      <div className="rounded-2xl bg-[#2D1B4E] p-5 sm:p-6 animate-pulse h-[120px]" />
    )
  }

  // Extract name from greeting (format: "こんにちは、田中先生")
  const greetingParts = greeting.split('、')
  const greetPrefix = greetingParts[0] + '、'
  const greetName = greetingParts[1] || ''

  const nextLessonText = nextLesson
    ? t('nextLessonAt', {
        time: format(new Date(nextLesson.start_time), 'HH:mm'),
        name: studentNames[nextLesson.student_id] || tc('student'),
      })
    : t('noNextLesson')

  const incomeFormatted = `\u00a5${Math.round(todayEstimatedIncome).toLocaleString('ja-JP')}`

  return (
    <div className="relative rounded-2xl bg-[#2D1B4E] overflow-hidden" style={{ height: 120 }}>
      {/* Decorative blurred ellipses */}
      <div className="absolute w-[200px] h-[200px] rounded-full bg-white/[0.03] -left-10 -top-[60px] pointer-events-none" />
      <div className="absolute w-[120px] h-[120px] rounded-full bg-white/[0.02] left-20 top-[30px] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-white/[0.025] right-0 -top-[180px] pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-6 sm:px-9">
        {/* Left: Greeting */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <span className="text-[#D4BEE4] text-xs sm:text-sm">{greetPrefix}</span>
          <span className="text-white text-xl sm:text-[30px] font-extrabold leading-tight">{greetName}</span>
        </div>

        {/* Right: Stat cards */}
        <div className="flex gap-3 sm:gap-4">
          {/* Today's lessons */}
          <div className="bg-white/[0.07] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <span className="text-[#D4BEE4] text-[10px] font-medium tracking-wider uppercase">{t('todayLessons')}</span>
            <div className="flex items-end gap-1 mt-0.5">
              <span className="text-white text-2xl sm:text-[32px] font-black leading-none">
                {completedTodayCount} / {todayCount}
              </span>
              <span className="text-[#D4BEE4] text-xs font-medium mb-0.5">{t('todayLessonsUnit') || 'コマ'}</span>
            </div>
          </div>

          {/* Next lesson */}
          <div className="hidden sm:flex bg-white/[0.07] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <span className="text-[#D4BEE4] text-[10px] font-medium tracking-wider uppercase">{t('nextLessonLabel') || '次のレッスン'}</span>
            <span className="text-white text-lg sm:text-[28px] font-bold leading-tight mt-0.5">
              {nextLesson
                ? `${format(new Date(nextLesson.start_time), 'HH:mm')}〜 ${studentNames[nextLesson.student_id] || tc('student')}`
                : t('noNextLesson')}
            </span>
          </div>

          {/* Today's income */}
          {todayEstimatedIncome > 0 && (
            <div className="hidden md:flex bg-white/[0.07] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <span className="text-[#D4BEE4] text-[10px] font-medium tracking-wider uppercase">{t('todayEstimatedIncome')}</span>
              <span className="text-white text-2xl sm:text-[32px] font-black leading-none mt-0.5">{incomeFormatted}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
