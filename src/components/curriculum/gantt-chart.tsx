'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronLeft, ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { CurriculumMaterial, CurriculumPhase, ExamSchedule } from '@/lib/types/database'
import { format, startOfWeek, addWeeks, addMonths, isSameWeek, isWithinInterval, startOfMonth, endOfMonth, differenceInWeeks, isBefore, isAfter, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'

// --- Constants ---
const CELL_WIDTH = 32
const LABEL_WIDTH = 220
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 64
const MILESTONE_HEIGHT = 28

// Subject color presets
const SUBJECT_COLORS: Record<string, string> = {
  '数学': '#6B21A8',
  '物理': '#0F766E',
  '化学': '#B45309',
  '英語': '#1D4ED8',
  '国語': '#BE123C',
  '社会': '#4338CA',
  '理科': '#15803D',
  '生物': '#059669',
}

const EXAM_CATEGORY_COLORS: Record<string, string> = {
  recommendation: '#2563EB',
  common_test: '#DC2626',
  general: '#7C3AED',
  certification: '#059669',
  school_exam: '#D97706',
}

// --- Types ---
interface GanttChartProps {
  materials: CurriculumMaterial[]
  phases: CurriculumPhase[]
  exams: ExamSchedule[]
  curriculumYear?: string
  onAddMaterial: () => void
  onEditMaterial: (material: CurriculumMaterial) => void
  onDeleteMaterial: (id: string) => void
  onAddPhase: (materialId: string) => void
  onEditPhase: (phase: CurriculumPhase) => void
  onDeletePhase: (id: string) => void
  onUpdatePhase: (id: string, updates: Partial<CurriculumPhase>) => Promise<void>
  onAddExam: () => void
  t: (key: string) => string
}

// --- Helpers ---
function getAcademicYearStart(yearStr?: string): Date {
  const year = yearStr ? parseInt(yearStr) : new Date().getFullYear()
  return new Date(year, 3, 1) // April 1st
}

function getWeekColumns(startDate: Date, weeks: number) {
  const cols: { date: Date; weekNum: number; month: number; year: number }[] = []
  for (let i = 0; i < weeks; i++) {
    const d = addWeeks(startDate, i)
    const weekStart = startOfWeek(d, { weekStartsOn: 1 })
    cols.push({
      date: weekStart,
      weekNum: Math.ceil(d.getDate() / 7),
      month: d.getMonth(),
      year: d.getFullYear(),
    })
  }
  return cols
}

function getMonthHeaders(columns: ReturnType<typeof getWeekColumns>) {
  const months: { month: number; year: number; startIdx: number; span: number; label: string }[] = []
  let current: typeof months[0] | null = null

  columns.forEach((col, idx) => {
    if (!current || current.month !== col.month || current.year !== col.year) {
      if (current) months.push(current)
      current = {
        month: col.month,
        year: col.year,
        startIdx: idx,
        span: 1,
        label: `${col.month + 1}月`,
      }
    } else {
      current.span++
    }
  })
  if (current) months.push(current)
  return months
}

function getBarPosition(
  startDate: string | undefined,
  endDate: string | undefined,
  columns: ReturnType<typeof getWeekColumns>
) {
  if (!startDate || !endDate || columns.length === 0) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const chartStart = columns[0].date
  const chartEnd = columns[columns.length - 1].date

  if (isAfter(start, chartEnd) || isBefore(end, chartStart)) return null

  const startWeekIdx = Math.max(0, differenceInWeeks(start, chartStart))
  const endWeekIdx = Math.min(columns.length - 1, differenceInWeeks(end, chartStart))

  return {
    left: startWeekIdx * CELL_WIDTH,
    width: Math.max(CELL_WIDTH, (endWeekIdx - startWeekIdx + 1) * CELL_WIDTH),
  }
}

const statusBgClass: Record<string, string> = {
  not_started: 'opacity-40',
  in_progress: 'opacity-80',
  completed: 'opacity-100',
}

// --- Component ---
export function GanttChart({
  materials,
  phases,
  exams,
  curriculumYear,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onAddPhase,
  onEditPhase,
  onDeletePhase,
  onUpdatePhase,
  onAddExam,
  t,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Calculate columns (60 weeks = ~14 months covering April to March + buffer)
  const yearStart = getAcademicYearStart(curriculumYear)
  const TOTAL_WEEKS = 56
  const columns = useMemo(() => getWeekColumns(yearStart, TOTAL_WEEKS), [yearStart])
  const monthHeaders = useMemo(() => getMonthHeaders(columns), [columns])

  // Group materials by subject
  const grouped = useMemo(() => {
    const g: Record<string, CurriculumMaterial[]> = {}
    materials.forEach(m => {
      if (!g[m.subject]) g[m.subject] = []
      g[m.subject].push(m)
    })
    // Sort materials within each subject by order_index
    Object.values(g).forEach(arr => arr.sort((a, b) => a.order_index - b.order_index))
    return g
  }, [materials])

  const subjects = Object.keys(grouped)

  // Get phases for a material
  const getPhases = (materialId: string) =>
    phases
      .filter(p => p.material_id === materialId)
      .sort((a, b) => a.order_index - b.order_index)

  // Today line position
  const todayPosition = useMemo(() => {
    const today = startOfDay(new Date())
    const chartStart = columns[0]?.date
    if (!chartStart) return null
    const weeksDiff = differenceInWeeks(today, chartStart)
    if (weeksDiff < 0 || weeksDiff >= TOTAL_WEEKS) return null
    return weeksDiff * CELL_WIDTH
  }, [columns])

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current && todayPosition !== null) {
      scrollRef.current.scrollLeft = Math.max(0, todayPosition - 200)
    }
  }, [todayPosition])

  // Calculate total chart rows
  const rows: { type: 'subject' | 'material'; subject: string; material?: CurriculumMaterial }[] = []
  subjects.forEach(subject => {
    rows.push({ type: 'subject', subject })
    grouped[subject].forEach(material => {
      rows.push({ type: 'material', subject, material })
    })
  })

  const totalHeight = HEADER_HEIGHT + MILESTONE_HEIGHT + rows.length * ROW_HEIGHT + 16
  const chartWidth = TOTAL_WEEKS * CELL_WIDTH

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('ganttTitle')}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onAddExam}>
              <Plus className="w-4 h-4 mr-1" />{t('addExam')}
            </Button>
            <Button size="sm" onClick={onAddMaterial}>
              <Plus className="w-4 h-4 mr-1" />{t('addMaterial')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex overflow-hidden border-t">
          {/* Left label column (fixed) */}
          <div className="flex-shrink-0 border-r bg-muted/30" style={{ width: LABEL_WIDTH }}>
            {/* Month header spacer */}
            <div style={{ height: HEADER_HEIGHT }} className="border-b flex items-end px-2 pb-1">
              <span className="text-xs text-muted-foreground font-medium">{t('subjectMaterial')}</span>
            </div>
            {/* Exam row spacer */}
            <div style={{ height: MILESTONE_HEIGHT }} className="border-b flex items-center px-2">
              <span className="text-xs text-muted-foreground">{t('examSchedule')}</span>
            </div>
            {/* Material labels */}
            {rows.map((row, idx) => (
              <div
                key={`label-${idx}`}
                style={{ height: ROW_HEIGHT }}
                className={`flex items-center border-b ${row.type === 'subject' ? 'bg-muted/50' : 'hover:bg-muted/20'}`}
                onMouseEnter={() => row.material && setHoveredRow(row.material.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {row.type === 'subject' ? (
                  <span className="px-2 text-xs font-bold text-foreground/80 uppercase tracking-wide">{row.subject}</span>
                ) : row.material ? (
                  <div className="flex items-center justify-between w-full px-2 gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.material.color || SUBJECT_COLORS[row.subject] || '#6B7280' }}
                      />
                      <span className="text-xs truncate">{row.material.material_name}</span>
                      {row.material.study_pace && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">({row.material.study_pace})</span>
                      )}
                    </div>
                    {hoveredRow === row.material.id && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onAddPhase(row.material!.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEditMaterial(row.material!)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onDeleteMaterial(row.material!.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Scrollable chart area */}
          <div ref={scrollRef} className="overflow-x-auto flex-1">
            <div style={{ width: chartWidth, position: 'relative' }}>
              {/* Month headers */}
              <div style={{ height: HEADER_HEIGHT }} className="border-b flex">
                <div className="w-full relative">
                  {/* Month labels */}
                  <div className="flex h-8">
                    {monthHeaders.map((mh, idx) => (
                      <div
                        key={`month-${idx}`}
                        className="text-xs font-semibold text-center border-r text-foreground/70 flex items-center justify-center"
                        style={{ width: mh.span * CELL_WIDTH }}
                      >
                        {mh.label}
                      </div>
                    ))}
                  </div>
                  {/* Week numbers */}
                  <div className="flex h-8">
                    {columns.map((col, idx) => (
                      <div
                        key={`week-${idx}`}
                        className="text-[10px] text-muted-foreground text-center border-r flex items-center justify-center"
                        style={{ width: CELL_WIDTH }}
                      >
                        {col.weekNum}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exam milestones row */}
              <div style={{ height: MILESTONE_HEIGHT }} className="border-b relative">
                {exams.map(exam => {
                  const examDate = new Date(exam.exam_date)
                  const chartStart = columns[0]?.date
                  if (!chartStart) return null
                  const weeksDiff = differenceInWeeks(examDate, chartStart)
                  if (weeksDiff < 0 || weeksDiff >= TOTAL_WEEKS) return null
                  const left = weeksDiff * CELL_WIDTH
                  const color = EXAM_CATEGORY_COLORS[exam.exam_category] || '#6B7280'
                  return (
                    <div
                      key={exam.id}
                      className="absolute top-0 flex flex-col items-center cursor-pointer group"
                      style={{ left, zIndex: 10 }}
                      title={`${exam.exam_name}${exam.method ? ` (${exam.method})` : ''} - ${format(examDate, 'M/d')}`}
                    >
                      <div
                        className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent"
                        style={{ borderTopColor: color }}
                      />
                      <span className="text-[9px] font-medium whitespace-nowrap mt-0.5" style={{ color }}>
                        {exam.exam_name.length > 4 ? exam.exam_name.slice(0, 4) : exam.exam_name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Gantt rows */}
              {rows.map((row, idx) => (
                <div
                  key={`row-${idx}`}
                  style={{ height: ROW_HEIGHT }}
                  className={`relative border-b ${row.type === 'subject' ? 'bg-muted/30' : ''}`}
                >
                  {/* Grid lines */}
                  {columns.map((col, colIdx) => (
                    <div
                      key={`grid-${colIdx}`}
                      className={`absolute top-0 bottom-0 border-r border-border/30 ${col.weekNum === 1 ? 'border-border/60' : ''}`}
                      style={{ left: colIdx * CELL_WIDTH, width: CELL_WIDTH }}
                    />
                  ))}

                  {/* Phase bars for material rows */}
                  {row.type === 'material' && row.material && getPhases(row.material.id).map(phase => {
                    const pos = getBarPosition(phase.start_date, phase.end_date, columns)
                    if (!pos) return null
                    const color = row.material!.color || SUBJECT_COLORS[row.subject] || '#6B7280'
                    return (
                      <div
                        key={phase.id}
                        className={`absolute top-1 rounded-sm cursor-pointer transition-opacity hover:opacity-100 group/bar flex items-center px-1 ${statusBgClass[phase.status] || 'opacity-40'}`}
                        style={{
                          left: pos.left,
                          width: pos.width,
                          height: ROW_HEIGHT - 8,
                          backgroundColor: color,
                          zIndex: 5,
                        }}
                        onClick={() => onEditPhase(phase)}
                        title={`${phase.phase_name}${phase.total_hours ? ` (${phase.total_hours}h)` : ''}`}
                      >
                        <span className="text-[10px] text-white font-medium truncate leading-tight">
                          {phase.phase_name}
                        </span>
                        <button
                          className="ml-auto opacity-0 group-hover/bar:opacity-100 text-white/80 hover:text-white flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); onDeletePhase(phase.id) }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* Today line */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: todayPosition }}
                >
                  <div className="absolute -top-0 -left-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
              )}

              {/* Exam vertical lines */}
              {exams.map(exam => {
                const examDate = new Date(exam.exam_date)
                const chartStart = columns[0]?.date
                if (!chartStart) return null
                const weeksDiff = differenceInWeeks(examDate, chartStart)
                if (weeksDiff < 0 || weeksDiff >= TOTAL_WEEKS) return null
                const left = weeksDiff * CELL_WIDTH
                const color = EXAM_CATEGORY_COLORS[exam.exam_category] || '#6B7280'
                return (
                  <div
                    key={`line-${exam.id}`}
                    className="absolute bottom-0 w-px opacity-30 pointer-events-none"
                    style={{ left, top: HEADER_HEIGHT + MILESTONE_HEIGHT, backgroundColor: color }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {materials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm mb-3">{t('emptyGantt')}</p>
            <Button size="sm" onClick={onAddMaterial}>
              <Plus className="w-4 h-4 mr-1" />{t('addMaterial')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
