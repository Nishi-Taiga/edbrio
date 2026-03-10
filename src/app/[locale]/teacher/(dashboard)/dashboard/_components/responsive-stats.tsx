"use client"

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, CheckCircle, CheckCircle2, Banknote, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ResponsiveStatsProps {
  thisMonthDone: number
  thisMonthTotal: number
  lastMonthDone: number
  lastMonthTotal: number
  thisMonthIncome: number
  lastMonthIncome: number
  loading: boolean
}

export function ResponsiveStats({
  thisMonthDone,
  thisMonthTotal,
  thisMonthIncome,
  lastMonthIncome,
  loading,
}: ResponsiveStatsProps) {
  const t = useTranslations('teacherDashboard')
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] p-4 md:p-6 animate-pulse space-y-4">
        <div className="h-4 bg-gray-100 dark:bg-[#282237] rounded w-24" />
        <div className="h-20 md:h-[120px] bg-gray-100 dark:bg-[#282237] rounded" />
      </div>
    )
  }

  const completionRate = thisMonthTotal > 0 ? thisMonthDone / thisMonthTotal : 0
  const completionPercent = Math.round(completionRate * 100)
  const remaining = thisMonthTotal - thisMonthDone

  const incomeDelta = thisMonthIncome - lastMonthIncome
  const incomePercent = lastMonthIncome > 0
    ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
    : 0
  const incomeFormatted = `\u00a5${Math.round(thisMonthIncome).toLocaleString('ja-JP')}`

  // SVG ring params
  const mobileSize = 80
  const mobileStrokeWidth = 8
  const mobileRadius = (mobileSize - mobileStrokeWidth) / 2
  const mobileCircumference = 2 * Math.PI * mobileRadius
  const mobileStrokeDashoffset = mobileCircumference * (1 - completionRate)

  const desktopSize = 90
  const desktopStrokeWidth = 10
  const desktopRadius = (desktopSize - desktopStrokeWidth) / 2
  const desktopCircumference = 2 * Math.PI * desktopRadius
  const desktopStrokeDashoffset = desktopCircumference * (1 - completionRate)

  const trendIcon = incomeDelta > 0
    ? <><TrendingUp className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#10B981]" /><span className="text-xs font-semibold text-[#10B981]">{t('momPositive', { percent: incomePercent })}</span></>
    : incomeDelta < 0
    ? <><TrendingDown className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#EF4444]" /><span className="text-xs font-semibold text-[#EF4444]">{t('momNegative', { percent: incomePercent })}</span></>
    : <><Minus className="w-3.5 md:w-4 h-3.5 md:h-4 text-gray-400 dark:text-[#6D5A8A]" /><span className="text-xs font-semibold text-gray-400 dark:text-[#6D5A8A]">{t('momFlat')}</span></>

  return (
    <div className="h-full rounded-2xl border border-[#E5E0D8] md:border-gray-200 dark:border-[#2E2840] bg-white dark:bg-[#1E1A2B] p-4 md:p-5 lg:p-4 flex flex-col gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)] md:shadow-none">
      {/* Header — mobile: collapsible with summary, desktop: simple title */}
      <div className="md:hidden">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full">
          <h3 className="text-base font-extrabold text-[#1E1E2E] dark:text-[#E8E4F0]">
            {t('monthlyStatsTitle')}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">{completionPercent}%</span>
            <div className="w-px h-3.5 bg-[#E5E0D8] dark:bg-[#2E2840] opacity-50" />
            <span className="text-sm font-bold text-[#1E1E2E] dark:text-[#E8E4F0]">{incomeFormatted}</span>
            <ChevronDown className={`w-5 h-5 text-[#6B7280] dark:text-[#6D5A8A] transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>
      <h3 className="hidden md:block text-xs font-bold text-gray-500 dark:text-[#9CA3AF] tracking-widest uppercase">{t('monthlyStatsTitle')}</h3>

      {/* Content — mobile: row layout, desktop: centered column */}
      <div className={`${expanded ? '' : 'hidden'} md:!flex md:flex-col md:gap-2`}>
        {/* Mobile: row layout (ring + details) */}
        <div className="flex items-center gap-5 md:hidden">
          {/* Mobile progress ring (80px) */}
          <div className="relative shrink-0" style={{ width: mobileSize, height: mobileSize }}>
            <svg viewBox={`0 0 ${mobileSize} ${mobileSize}`} className="w-full h-full">
              <circle
                cx={mobileSize / 2} cy={mobileSize / 2} r={mobileRadius}
                fill="none" strokeWidth={mobileStrokeWidth}
                className="stroke-[#EDE8F5] dark:stroke-[#1A1726]"
              />
              <circle
                cx={mobileSize / 2} cy={mobileSize / 2} r={mobileRadius}
                fill="none" strokeWidth={mobileStrokeWidth}
                stroke="url(#mobileRingGrad)"
                strokeDasharray={mobileCircumference}
                strokeDashoffset={mobileStrokeDashoffset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
              <defs>
                <linearGradient id="mobileRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2D1B4E" />
                  <stop offset="30%" stopColor="#7C3AED" />
                  <stop offset="72%" stopColor="#D4BEE4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-[#7C3AED] dark:text-[#A78BFA]">{completionPercent}%</span>
            </div>
          </div>

          {/* Mobile details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
              <span className="text-sm font-semibold text-[#1E1E2E] dark:text-[#E8E4F0]">
                {t('lessonsCompleted', { done: thisMonthDone, total: thisMonthTotal })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
              <span className="text-sm font-semibold text-[#1E1E2E] dark:text-[#E8E4F0]">
                {t('incomeConfirmed', { amount: incomeFormatted })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {trendIcon}
            </div>
          </div>
        </div>

        {/* Desktop: centered column layout */}
        <div className="hidden md:flex md:flex-col md:gap-2">
          {/* Desktop progress ring */}
          <div className="flex justify-center py-1">
            <div className="relative" style={{ width: desktopSize, height: desktopSize }}>
              <svg viewBox={`0 0 ${desktopSize} ${desktopSize}`} className="w-full h-full">
                <circle
                  cx={desktopSize / 2} cy={desktopSize / 2} r={desktopRadius}
                  fill="none" strokeWidth={desktopStrokeWidth}
                  className="stroke-[#EDE8F5] dark:stroke-[#1A1726]"
                />
                <circle
                  cx={desktopSize / 2} cy={desktopSize / 2} r={desktopRadius}
                  fill="none" strokeWidth={desktopStrokeWidth}
                  stroke="url(#desktopRingGrad)"
                  strokeDasharray={desktopCircumference}
                  strokeDashoffset={desktopStrokeDashoffset}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
                <defs>
                  <linearGradient id="desktopRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2D1B4E" className="dark:[stop-color:#0F0D18]" />
                    <stop offset="40%" stopColor="#7C3AED" className="dark:[stop-color:#A78BFA]" />
                    <stop offset="100%" stopColor="#D4BEE4" className="dark:[stop-color:#6D5A8A]" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-black text-[#2D1B4E] dark:text-[#E8E4F0]">{completionPercent}%</span>
                {remaining > 0 && (
                  <span className="text-[10px] font-semibold text-[#7C3AED] dark:text-[#A78BFA]">{t('remainingLessons', { count: remaining })}</span>
                )}
              </div>
            </div>
          </div>

          {/* Lesson count */}
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-[18px] h-[18px] text-[#7C3AED] dark:text-[#A78BFA]" />
            <div className="flex items-end gap-1">
              <span className="text-[22px] font-black text-[#2D1B4E] dark:text-[#E8E4F0] leading-none">{thisMonthDone}</span>
              <span className="text-[12px] font-medium text-gray-500 dark:text-[#6D5A8A] mb-0.5">{t('completedSlashTotal', { total: thisMonthTotal })}</span>
            </div>
          </div>

          {/* Income section */}
          <div className="flex flex-col items-center gap-1 mt-1">
            <span className="text-[22px] font-black text-gray-800 dark:text-[#E8E4F0] leading-none">{incomeFormatted}</span>
            <span className="text-[11px] text-gray-400 dark:text-[#6D5A8A]">{t('monthlyIncome')}</span>
            <div className="flex items-center gap-1">
              {trendIcon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
