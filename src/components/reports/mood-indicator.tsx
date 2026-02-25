'use client'

import { Smile, Meh, Battery, AlertCircle } from 'lucide-react'

const moodConfig: Record<string, { icon: typeof Smile; label: string; color: string }> = {
  good: { icon: Smile, label: '集中', color: 'text-green-600' },
  neutral: { icon: Meh, label: '普通', color: 'text-gray-500' },
  tired: { icon: Battery, label: '疲れ', color: 'text-yellow-600' },
  unmotivated: { icon: AlertCircle, label: '低調', color: 'text-red-500' },
}

export function MoodIndicator({ mood }: { mood: string }) {
  const config = moodConfig[mood]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}
