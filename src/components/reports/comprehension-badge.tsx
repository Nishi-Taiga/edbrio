'use client'

import { useTranslations } from 'next-intl'

const levelColors: Record<number, string> = {
  1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  2: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  3: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  4: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  5: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export function ComprehensionBadge({ level }: { level: number }) {
  const t = useTranslations('reports')
  const color = levelColors[level] || levelColors[3]
  const labelKey = `comprehension.level${level}` as const
  const label = t(labelKey)
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {'★'.repeat(level)}{'☆'.repeat(5 - level)} {label}
    </span>
  )
}
