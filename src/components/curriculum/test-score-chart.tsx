'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { TestScore } from '@/lib/types/database'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface TestScoreChartProps {
  scores: TestScore[]
  t: (key: string) => string
}

const SUBJECT_COLORS = ['#6B21A8', '#0F766E', '#1D4ED8', '#B45309', '#BE123C', '#4338CA', '#059669']

export function TestScoreChart({ scores, t }: TestScoreChartProps) {
  const { chartData, subjects } = useMemo(() => {
    if (scores.length === 0) return { chartData: [], subjects: [] }

    // Get unique subjects
    const subjectSet = new Set(scores.map(s => s.subject))
    const subjects = Array.from(subjectSet)

    // Group by test_date and create chart data
    const dateMap = new Map<string, Record<string, number>>()
    const sorted = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())

    sorted.forEach(score => {
      const dateKey = score.test_date
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, {})
      const entry = dateMap.get(dateKey)!
      // Store percentage
      entry[score.subject] = (score.score / score.max_score) * 100
    })

    const chartData = Array.from(dateMap.entries()).map(([date, values]) => ({
      date: format(new Date(date), 'M/d'),
      ...values,
    }))

    return { chartData, subjects }
  }, [scores])

  if (scores.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5" />
          {t('testChartTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => `${Number(value).toFixed(0)}%`}
            />
            <Legend />
            {subjects.map((subject, idx) => (
              <Line
                key={subject}
                type="monotone"
                dataKey={subject}
                stroke={SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={subject}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
