"use client"

import { useState } from 'react'
import { ChevronDown, CheckCircle2, Banknote, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  thisMonthDone: number
  thisMonthTotal: number
  thisMonthIncome: number
  lastMonthIncome: number
  loading: boolean
}

export function MobileStatsCard({ thisMonthDone, thisMonthTotal, thisMonthIncome, lastMonthIncome, loading }: Props) {
  const t = useTranslations('teacherDashboard')
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] p-4 animate-pulse space-y-3">
        <div className="h-5 w-24 bg-gray-100 dark:bg-[#282237] rounded" />
        <div className="h-20 bg-gray-100 dark:bg-[#282237] rounded" />
      </div>
    )
  }

  const completionRate = thisMonthTotal > 0 ? thisMonthDone / thisMonthTotal : 0
  const completionPercent = Math.round(completionRate * 100)
  const incomeFormatted = `¥${Math.round(thisMonthIncome).toLocaleString('ja-JP')}`
  const incomeDelta = thisMonthIncome - lastMonthIncome
  const incomePercent = lastMonthIncome > 0
    ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
    : 0

  // SVG ring
  const size = 80
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - completionRate)

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E1A2B] border border-[#E5E0D8] dark:border-[#2E2840] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
      {/* Header */}
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

      {expanded && (
        <div className="flex items-center gap-5">
          {/* Progress Ring */}
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
              <ellipse
                cx={size / 2} cy={size / 2} rx={radius} ry={radius}
                fill="white" className="dark:fill-[#1E1A2B]"
              />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" strokeWidth={strokeWidth}
                className="stroke-[#EDE8F5] dark:stroke-[#1A1726]"
              />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" strokeWidth={strokeWidth}
                stroke="url(#mobileRingGrad)"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
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

          {/* Details */}
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
              {incomeDelta > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span className="text-xs font-semibold text-[#10B981]">{t('momPositive', { percent: incomePercent })}</span>
                </>
              ) : incomeDelta < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                  <span className="text-xs font-semibold text-[#EF4444]">{t('momNegative', { percent: incomePercent })}</span>
                </>
              ) : (
                <>
                  <Minus className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#6D5A8A] shrink-0" />
                  <span className="text-xs font-semibold text-[#6B7280] dark:text-[#6D5A8A]">{t('momFlat')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
