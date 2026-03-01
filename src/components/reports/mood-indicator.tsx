'use client'

import { Smile, Meh, Battery, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

const moodIcons: Record<string, { icon: typeof Smile; color: string }> = {
  good: { icon: Smile, color: 'text-green-600' },
  neutral: { icon: Meh, color: 'text-gray-500' },
  tired: { icon: Battery, color: 'text-yellow-600' },
  unmotivated: { icon: AlertCircle, color: 'text-red-500' },
}

export function MoodIndicator({ mood }: { mood: string }) {
  const t = useTranslations('reports')
  const config = moodIcons[mood]
  if (!config) return null
  const Icon = config.icon
  const moodLabels: Record<string, string> = {
    good: t('mood.good'),
    neutral: t('mood.neutral'),
    tired: t('mood.tired'),
    unmotivated: t('mood.unmotivated'),
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {moodLabels[mood] || mood}
    </span>
  )
}
