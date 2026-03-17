'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { TestScore, ExamSchedule, TestType } from '@/lib/types/database'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'

interface TestScoreChartProps {
  scores: TestScore[]
  exams?: ExamSchedule[]
  t: (key: string) => string
  onScoreClick?: (scoreId: string) => void
}

const TEST_TYPES: TestType[] = ['school_exam', 'mock_exam', 'quiz', 'entrance_exam', 'other']
const SUBJECT_COLORS = ['#6B21A8', '#0F766E', '#1D4ED8', '#B45309', '#BE123C', '#4338CA', '#059669']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload, dataKey, onScoreClick } = props
  if (cx == null || cy == null) return null
  const scoreId = payload?.[`_id_${dataKey}`]
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={props.stroke}
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: scoreId && onScoreClick ? 'pointer' : 'default' }}
      onClick={() => { if (scoreId && onScoreClick) onScoreClick(scoreId) }}
    />
  )
}

export function TestScoreChart({ scores, exams, t, onScoreClick }: TestScoreChartProps) {
  const availableTypes = useMemo(() =>
    TEST_TYPES.filter(type => scores.some(s => s.test_type === type)),
    [scores],
  )

  const [activeType, setActiveType] = useState<TestType | null>(null)
  const selectedType = activeType ?? availableTypes[0] ?? null

  const { chartData, subjects } = useMemo(() => {
    if (!selectedType) return { chartData: [], subjects: [] }

    const filtered = scores.filter(s => s.test_type === selectedType)
    if (filtered.length === 0) return { chartData: [], subjects: [] }

    const subjectSet = new Set(filtered.map(s => s.subject))
    const subjects = Array.from(subjectSet)

    const dateMap = new Map<string, Record<string, number | string>>()
    const sorted = [...filtered].sort((a, b) =>
      new Date(a.test_date).getTime() - new Date(b.test_date).getTime(),
    )

    sorted.forEach(score => {
      const dateKey = score.test_date
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, {})
      const entry = dateMap.get(dateKey)!
      entry[score.subject] = (score.score / score.max_score) * 100
      entry[`_id_${score.subject}`] = score.id
    })

    const chartData = Array.from(dateMap.entries()).map(([date, values]) => ({
      date: format(new Date(date), 'M/d'),
      ...values,
    }))

    return { chartData, subjects }
  }, [scores, selectedType])

  const borderScore = useMemo(() => {
    if (!exams) return null
    const firstChoice = exams.find(e => e.preference_order === 1)
    return firstChoice?.border_score ?? null
  }, [exams])

  const handleDotClick = useCallback((scoreId: string) => {
    onScoreClick?.(scoreId)
  }, [onScoreClick])

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
        {/* Test type tabs */}
        {availableTypes.length > 1 && (
          <div className="flex gap-1 mb-4 border-b">
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  selectedType === type
                    ? 'border-[#7C3AED] text-[#7C3AED]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`testType_${type}`)}
              </button>
            ))}
          </div>
        )}

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
            {borderScore !== null && (
              <ReferenceLine
                y={borderScore}
                stroke="#EF4444"
                strokeDasharray="6 3"
                label={{
                  value: `ボーダー ${borderScore}%`,
                  position: 'right',
                  fill: '#EF4444',
                  fontSize: 11,
                }}
              />
            )}
            {subjects.map((subject, idx) => (
              <Line
                key={subject}
                type="monotone"
                dataKey={subject}
                stroke={SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}
                strokeWidth={2}
                dot={<CustomDot onScoreClick={handleDotClick} />}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name={subject}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
