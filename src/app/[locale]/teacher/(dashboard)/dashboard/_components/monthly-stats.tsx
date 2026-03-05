"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
      <Card>
        <CardContent className="p-6 animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-16 bg-muted rounded-full w-16 mx-auto" />
          <div className="h-4 bg-muted rounded w-32" />
        </CardContent>
      </Card>
    )
  }

  const completionRate = thisMonthTotal > 0 ? thisMonthDone / thisMonthTotal : 0
  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference * (1 - completionRate)

  const incomeDelta = thisMonthIncome - lastMonthIncome
  const incomeFormatted = `\u00a5${Math.round(thisMonthIncome).toLocaleString('ja-JP')}`
  const deltaFormatted = incomeDelta >= 0
    ? `+\u00a5${Math.round(incomeDelta).toLocaleString('ja-JP')}`
    : `-\u00a5${Math.round(Math.abs(incomeDelta)).toLocaleString('ja-JP')}`

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('monthlyStatsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Completion rate with progress ring */}
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 72 72" className="w-16 h-16 shrink-0">
            <circle
              cx="36" cy="36" r="28"
              fill="none" strokeWidth="7"
              className="stroke-muted"
            />
            <circle
              cx="36" cy="36" r="28"
              fill="none" strokeWidth="7"
              stroke="#10B981"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
            <text
              x="36" y="40"
              textAnchor="middle"
              className="fill-foreground font-bold"
              fontSize="14"
            >
              {Math.round(completionRate * 100)}%
            </text>
          </svg>
          <div>
            <p className="text-sm text-muted-foreground">{t('completionRate')}</p>
            <p className="text-lg font-semibold">
              {t('monthlyCompletedCount', { done: thisMonthDone, total: thisMonthTotal })}
            </p>
          </div>
        </div>

        {/* Monthly income */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-1">{t('monthlyIncome')}</p>
          <p className="text-xl font-bold">{incomeFormatted}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-muted-foreground">{t('monthlyIncomeDelta')}</span>
            {incomeDelta > 0 ? (
              <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                {deltaFormatted}
              </span>
            ) : incomeDelta < 0 ? (
              <span className="flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                <TrendingDown className="w-3 h-3" />
                {deltaFormatted}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Minus className="w-3 h-3" />
                ±¥0
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
