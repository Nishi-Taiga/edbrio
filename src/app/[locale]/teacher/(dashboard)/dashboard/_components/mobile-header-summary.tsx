"use client"

import { Booking } from '@/lib/types/database'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

interface Props {
  nextLesson: Booking | null
  studentNames: Record<string, string>
  loading: boolean
}

export function MobileHeaderSummary({ nextLesson, studentNames, loading }: Props) {
  const t = useTranslations('teacherDashboard')

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#2D1B4E] dark:bg-[#0F0D18] border border-[#3D2B5E] dark:border-[#1A1726] pt-4 px-5 pb-5 animate-pulse">
        <div className="h-3 w-20 bg-[#3D2B5E] rounded mb-2" />
        <div className="h-7 w-52 bg-[#3D2B5E] rounded" />
      </div>
    )
  }

  const nextText = nextLesson
    ? `${format(new Date(nextLesson.start_time), 'HH:mm')}〜 ${studentNames[nextLesson.student_id] || ''}`
    : t('noNextLesson')

  return (
    <div className="rounded-2xl bg-[#2D1B4E] dark:bg-[#0F0D18] border border-[#3D2B5E] dark:border-[#1A1726] pt-4 px-5 pb-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <p className="text-[11px] font-medium text-[#D4BEE4] dark:text-[#9CA3AF] tracking-[1px] mb-1">
        {t('nextLessonLabel')}
      </p>
      <p className="text-[22px] font-extrabold text-white leading-tight">
        {nextText}
      </p>
    </div>
  )
}
