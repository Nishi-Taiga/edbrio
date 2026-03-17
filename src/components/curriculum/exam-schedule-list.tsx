'use client'

import { useMemo } from 'react'
import { Plus, Trash2, Pencil, Calendar } from 'lucide-react'
import { ExamSchedule } from '@/lib/types/database'
import { format, isBefore, startOfDay } from 'date-fns'

interface ExamScheduleListProps {
  exams: ExamSchedule[]
  academicYear?: number
  onAdd: () => void
  onEdit: (exam: ExamSchedule) => void
  onDelete: (id: string) => Promise<void>
  t: (key: string) => string
}

const statusConfig = (examDate: string) => {
  const today = startOfDay(new Date())
  const date = new Date(examDate)
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / 86400000)

  if (isBefore(date, today)) {
    return { label: '終了', bg: '#F3F4F6', color: '#6B7280' }
  }
  if (daysUntil <= 14) {
    return { label: '直前', bg: '#FEE2E2', color: '#EF4444' }
  }
  if (daysUntil <= 60) {
    return { label: '準備中', bg: '#FEF3C7', color: '#D97706' }
  }
  return { label: '予定', bg: '#DBEAFE', color: '#3B82F6' }
}

/**
 * Abbreviate exam names to initials.
 * If duplicates exist, extend characters until unique.
 */
function abbreviateExamNames(exams: ExamSchedule[]): Map<string, string> {
  const nameMap = new Map<string, string>()
  const names = exams.map(e => e.exam_name)

  for (const name of names) {
    if (nameMap.has(name)) continue

    // Start with 1 character
    let len = 1
    let abbr = name.slice(0, len)

    // Extend until no other name shares the same abbreviation
    while (len < name.length) {
      const conflicts = names.filter(n => n !== name && n.slice(0, len) === abbr)
      if (conflicts.length === 0) break
      len++
      abbr = name.slice(0, len)
    }

    nameMap.set(name, abbr)
  }

  return nameMap
}

/** Check if an exam date falls within the given academic year (April–March) */
function isInAcademicYear(examDate: string, year: number): boolean {
  const date = new Date(examDate)
  const start = new Date(year, 3, 1) // April 1
  const end = new Date(year + 1, 2, 31, 23, 59, 59) // March 31
  return date >= start && date <= end
}

function formatBorderScore(exam: ExamSchedule): string {
  if (exam.border_score == null) return '—'
  const type = exam.border_score_type ?? 'deviation'
  if (type === 'percentage') return `${exam.border_score}%`
  return `偏差値 ${exam.border_score}`
}

export function ExamScheduleList({ exams, academicYear, onAdd, onEdit, onDelete, t }: ExamScheduleListProps) {
  // Filter by academic year if provided
  const filtered = useMemo(() => {
    if (academicYear == null) return exams
    return exams.filter(e => isInAcademicYear(e.exam_date, academicYear))
  }, [exams, academicYear])

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      const aOrder = a.preference_order ?? 999
      const bOrder = b.preference_order ?? 999
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    }),
  [filtered])

  const abbrevMap = useMemo(() => abbreviateExamNames(sorted), [sorted])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-[18px] h-[18px] text-red-500" />
          <h3 className="text-base font-bold text-foreground">{t('examTitle')}</h3>
        </div>
        <button
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
          onClick={onAdd}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('addExam')}
        </button>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="px-6 pb-6 text-muted-foreground text-sm">{t('examEmpty')}</div>
      ) : (
        <div className="mx-6 mb-5 rounded-lg border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-muted/30">
                <th className="text-center py-2.5 px-2 text-[11px] font-bold text-muted-foreground tracking-wider w-[50px]">志望順</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider">学校・試験名</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider">方式</th>
                <th className="text-right py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[110px] hidden sm:table-cell">ボーダー</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[120px]">日付</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[100px] hidden sm:table-cell">ステータス</th>
                <th className="w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(exam => {
                const status = statusConfig(exam.exam_date)
                const abbrev = abbrevMap.get(exam.exam_name) ?? exam.exam_name
                return (
                  <tr key={exam.id} className="border-t border-border hover:bg-muted/20 transition-colors group">
                    <td className="py-2.5 px-2 text-center text-xs font-bold text-foreground">
                      {exam.preference_order ? `第${exam.preference_order}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-foreground text-xs" title={exam.exam_name}>
                      {abbrev}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{exam.method || '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      {formatBorderScore(exam)}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-foreground text-xs whitespace-nowrap">
                      {format(new Date(exam.exam_date), 'M/d')}
                    </td>
                    <td className="py-2.5 px-4 hidden sm:table-cell">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-muted" onClick={() => onEdit(exam)}>
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1 rounded hover:bg-muted" onClick={() => onDelete(exam.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
