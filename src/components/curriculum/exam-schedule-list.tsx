'use client'

import { Button } from '@/components/ui/button'
import { Plus, Trash2, Pencil, Calendar } from 'lucide-react'
import { ExamSchedule } from '@/lib/types/database'
import { format, isBefore, startOfDay } from 'date-fns'

interface ExamScheduleListProps {
  exams: ExamSchedule[]
  onAdd: () => void
  onEdit: (exam: ExamSchedule) => void
  onDelete: (id: string) => Promise<void>
  t: (key: string) => string
}

const categoryLabel: Record<string, string> = {
  recommendation: '推薦',
  common_test: '共通',
  general: '一般',
  certification: '検定',
  school_exam: '定期',
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

export function ExamScheduleList({ exams, onAdd, onEdit, onDelete, t }: ExamScheduleListProps) {
  const sorted = [...exams].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-[18px] h-[18px] text-red-500" />
          <h3 className="text-base font-bold text-foreground">{t('examTitle')}（仮）</h3>
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
        <div className="mx-6 mb-5 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-muted/30">
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider">大学</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider">方式</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[120px]">日付</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[100px]">ステータス</th>
                <th className="w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(exam => {
                const status = statusConfig(exam.exam_date)
                return (
                  <tr key={exam.id} className="border-t border-border hover:bg-muted/20 transition-colors group">
                    <td className="py-2.5 px-4 font-semibold text-foreground text-xs">{exam.exam_name}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{exam.method || '—'}</td>
                    <td className="py-2.5 px-4 font-medium text-foreground text-xs whitespace-nowrap">
                      {format(new Date(exam.exam_date), 'M/d')}
                    </td>
                    <td className="py-2.5 px-4">
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
