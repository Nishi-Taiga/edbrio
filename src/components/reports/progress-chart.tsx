'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTranslations } from 'next-intl'

interface DataPoint {
  date: string
  level: number
}

interface ProgressChartProps {
  studentName: string
  data: DataPoint[]
}

const levelColors: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-blue-400',
  5: 'bg-green-400',
}

export function ProgressChart({ studentName, data }: ProgressChartProps) {
  const t = useTranslations('reports')
  if (data.length === 0) return null

  const levelLabels: Record<number, string> = {
    1: t('progress.level1'),
    2: t('progress.level2'),
    3: t('progress.level3'),
    4: t('progress.level4'),
    5: t('progress.level5'),
  }

  const avg = data.reduce((sum, d) => sum + d.level, 0) / data.length
  const latest = data[data.length - 1]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{studentName}</CardTitle>
          <span className="text-xs text-gray-500">
            {t('progress.latest', { level: latest.level, label: levelLabels[latest.level] || '', avg: avg.toFixed(1) })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-20">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${levelColors[d.level] || 'bg-gray-300'}`}
                style={{ height: `${(d.level / 5) * 100}%` }}
                title={`${format(new Date(d.date), 'M/d', { locale: ja })} - ${d.level}/5`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[10px] text-gray-400">
                {format(new Date(d.date), 'M/d', { locale: ja })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
