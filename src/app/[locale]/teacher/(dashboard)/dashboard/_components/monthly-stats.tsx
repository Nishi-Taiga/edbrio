"use client"

import { TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface MonthlyStatsProps {
  thisMonthDone: number
  thisMonthTotal: number
  lastMonthDone: number
  lastMonthTotal: number
  thisMonthIncome: number
  lastMonthIncome: number
  loading: boolean
}

export function MonthlyStats({
  thisMonthDone,
  thisMonthTotal,
  lastMonthDone,
  lastMonthTotal,
  thisMonthIncome,
  lastMonthIncome,
  loading,
}: MonthlyStatsProps) {
  const t = useTranslations('teacherDashboard')

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse space-y-4">
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="h-[120px] bg-gray-100 rounded" />
        <div className="h-4 bg-gray-100 rounded w-32" />
      </div>
    )
  }

  const completionRate = thisMonthTotal > 0 ? thisMonthDone / thisMonthTotal : 0
  const completionPercent = Math.round(completionRate * 100)
  const remaining = thisMonthTotal - thisMonthDone

  // SVG progress ring (purple gradient like Pencil design)
  const size = 120
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - completionRate)

  const incomeDelta = thisMonthIncome - lastMonthIncome
  const incomePercent = lastMonthIncome > 0
    ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
    : 0
  const incomeFormatted = `\u00a5${Math.round(thisMonthIncome).toLocaleString('ja-JP')}`

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-2">
      <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase">{t('monthlyStatsTitle')}</h3>

      {/* Progress ring */}
      <div className="flex justify-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background ring */}
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" strokeWidth={strokeWidth}
              stroke="#EDE8F5"
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" strokeWidth={strokeWidth}
              stroke="url(#purpleGradient)"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2D1B4E" />
                <stop offset="40%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#D4BEE4" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-black text-[#2D1B4E]">{completionPercent}%</span>
            {remaining > 0 && (
              <span className="text-[10px] font-semibold text-[#7C3AED]">あと{remaining}コマ!</span>
            )}
          </div>
        </div>
      </div>

      {/* Lesson count */}
      <div className="flex items-center justify-center gap-2">
        <CheckCircle className="w-[18px] h-[18px] text-[#7C3AED]" />
        <div className="flex items-end gap-1">
          <span className="text-[28px] font-black text-[#2D1B4E] leading-none">{thisMonthDone}</span>
          <span className="text-[13px] font-medium text-gray-500 mb-0.5">/ {thisMonthTotal} コマ完了</span>
        </div>
      </div>

      {/* Income section */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <span className="text-[28px] font-black text-gray-800 leading-none">{incomeFormatted}</span>
        <span className="text-[11px] text-gray-400">{t('monthlyIncome')}</span>
        <div className="flex items-center gap-1">
          {incomeDelta > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              <span className="text-xs font-semibold text-[#10B981]">前月比 +{incomePercent}%</span>
            </>
          ) : incomeDelta < 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              <span className="text-xs font-semibold text-[#EF4444]">前月比 {incomePercent}%</span>
            </>
          ) : (
            <>
              <Minus className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400">前月比 ±0%</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
