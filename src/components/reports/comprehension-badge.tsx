'use client'

const levelConfig: Record<number, { label: string; color: string }> = {
  1: { label: '理解不足', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  2: { label: 'やや不足', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  3: { label: '普通', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  4: { label: 'よく理解', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  5: { label: '完全理解', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

export function ComprehensionBadge({ level }: { level: number }) {
  const config = levelConfig[level] || levelConfig[3]
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {'★'.repeat(level)}{'☆'.repeat(5 - level)} {config.label}
    </span>
  )
}
