"use client"

import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { format, isSameDay, addDays } from 'date-fns'

interface ResponsiveSummaryProps {
  greeting: string
  todayCount: number
  completedTodayCount: number
  nextLesson: Booking | null
  studentNames: Record<string, string>
  todayEstimatedIncome: number
  loading: boolean
}

export function ResponsiveSummary({
  greeting,
  todayCount,
  completedTodayCount,
  nextLesson,
  studentNames,
  todayEstimatedIncome,
  loading,
}: ResponsiveSummaryProps) {
  const t = useTranslations('teacherDashboard')
  const tc = useTranslations('common')

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#2D1B4E] dark:bg-[#0F0D18] border border-[#3D2B5E] dark:border-[#1A1726] p-5 animate-pulse h-[80px] md:h-[120px]" />
    )
  }

  // Extract name from greeting (format: "こんにちは、田中先生")
  const greetingParts = greeting.split('、')
  const greetPrefix = greetingParts[0] + '、'
  const greetName = greetingParts[1] || ''

  const nextLessonText = (() => {
    if (!nextLesson) return t('noNextLesson')
    const lessonDate = new Date(nextLesson.start_time)
    const now = new Date()
    const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1)
    let dateStr: string
    if (isSameDay(lessonDate, now)) {
      dateStr = t('calendarToday')
    } else if (isSameDay(lessonDate, tomorrow)) {
      dateStr = t('tomorrow')
    } else {
      dateStr = format(lessonDate, 'M/d')
    }
    return t('nextLessonFormat', {
      date: dateStr,
      time: format(lessonDate, 'HH:mm'),
      name: studentNames[nextLesson.student_id] || tc('student'),
    })
  })()

  const incomeFormatted = `\u00a5${Math.round(todayEstimatedIncome).toLocaleString('ja-JP')}`

  return (
    <div className="relative rounded-2xl bg-[#2D1B4E] dark:bg-[#0F0D18] border border-[#3D2B5E] dark:border-[#1A1726] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]" style={{ minHeight: 80 }}>
      {/* Decorative blurred ellipses — desktop only */}
      <div className="hidden md:block absolute w-[200px] h-[200px] rounded-full bg-white/[0.03] -left-10 -top-[60px] pointer-events-none" />
      <div className="hidden md:block absolute w-[120px] h-[120px] rounded-full bg-white/[0.02] left-20 top-[30px] pointer-events-none" />
      <div className="hidden md:block absolute w-[300px] h-[300px] rounded-full bg-white/[0.025] right-0 -top-[180px] pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-5 md:px-9 py-4 md:py-0 md:h-[120px]">
        {/* Left: Mobile — next lesson only / Desktop — greeting */}
        <div className="flex flex-col gap-0.5 shrink-0">
          {/* Mobile: next lesson label + text */}
          <div className="md:hidden">
            <p className="text-[11px] font-medium text-[#D4BEE4] dark:text-[#9CA3AF] tracking-[1px] mb-1">
              {t('nextLessonLabel')}
            </p>
            <p className="text-[22px] font-extrabold text-white leading-tight">
              {nextLessonText}
            </p>
          </div>
          {/* Desktop: greeting */}
          <div className="hidden md:flex flex-col gap-0.5">
            <span className="text-[#D4BEE4] dark:text-[#9CA3AF] text-xs sm:text-sm">{greetPrefix}</span>
            <span className="text-white dark:text-[#E8E4F0] text-xl sm:text-[30px] font-extrabold leading-tight">{greetName}</span>
          </div>
        </div>

        {/* Right: Stat cards — desktop only */}
        <div className="hidden md:flex gap-3 lg:gap-4">
          {/* Today's lessons */}
          <div className="bg-white/[0.07] rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <span className="text-[#D4BEE4] dark:text-[#9CA3AF] text-[10px] font-medium tracking-wider uppercase">{t('todayLessons')}</span>
            <div className="flex items-end gap-1 mt-0.5">
              <span className="text-white text-2xl lg:text-[32px] font-black leading-none">
                {completedTodayCount} / {todayCount}
              </span>
              <span className="text-[#D4BEE4] text-xs font-medium mb-0.5">{t('todayLessonsUnit') || 'コマ'}</span>
            </div>
          </div>

          {/* Next lesson — lg+ */}
          <div className="hidden lg:flex bg-white/[0.07] rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <span className="text-[#D4BEE4] dark:text-[#9CA3AF] text-[10px] font-medium tracking-wider uppercase">{t('nextLessonLabel') || '次のレッスン'}</span>
            <span className="text-white text-lg lg:text-[28px] font-bold leading-tight mt-0.5">
              {nextLessonText}
            </span>
          </div>

          {/* Today's income — lg+ */}
          {todayEstimatedIncome > 0 && (
            <div className="hidden lg:flex bg-white/[0.07] rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <span className="text-[#D4BEE4] dark:text-[#9CA3AF] text-[10px] font-medium tracking-wider uppercase">{t('todayEstimatedIncome')}</span>
              <span className="text-white text-2xl lg:text-[32px] font-black leading-none mt-0.5">{incomeFormatted}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
