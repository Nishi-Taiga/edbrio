'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { CurriculumMaterial, CurriculumPhase, ExamSchedule, PhaseTask } from '@/lib/types/database'
import { differenceInDays, startOfDay, format } from 'date-fns'

// --- Constants ---
const LABEL_WIDTH = 180
const ROW_HEIGHT = 44
const HEADER_HEIGHT = 44
const EXAM_ROW_HEIGHT = 56
const SUBJECT_HEADER_HEIGHT = 28
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] // Academic year April–March
const MONTH_LABELS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月']

// Subject color mapping (fixed by subject)
const SUBJECT_COLORS: Record<string, { color: string; bg: string }> = {
  '国語': { color: '#BE123C', bg: '#FFF1F2' },
  '算数': { color: '#2563EB', bg: '#EFF6FF' },
  '数学': { color: '#2563EB', bg: '#EFF6FF' },
  '理科': { color: '#15803D', bg: '#ECFDF5' },
  '物理': { color: '#15803D', bg: '#ECFDF5' },
  '化学': { color: '#059669', bg: '#ECFDF5' },
  '生物': { color: '#16A34A', bg: '#ECFDF5' },
  '社会': { color: '#D97706', bg: '#FFFBEB' },
  '地理': { color: '#D97706', bg: '#FFFBEB' },
  '歴史': { color: '#EA580C', bg: '#FFF7ED' },
  '英語': { color: '#7C3AED', bg: '#F5F3FF' },
}

/** Get color for a subject, with fallback for unknown subjects */
export function getSubjectColor(subject: string): { color: string; bg: string } {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject]
  // Partial match: e.g. "数学A" matches "数学"
  for (const key of Object.keys(SUBJECT_COLORS)) {
    if (subject.includes(key)) return SUBJECT_COLORS[key]
  }
  return { color: '#6B7280', bg: '#F9FAFB' }
}

const EXAM_CATEGORY_COLORS: Record<string, string> = {
  recommendation: '#EF4444',
  common_test: '#F59E0B',
  general: '#3B82F6',
  certification: '#059669',
  school_exam: '#D97706',
}

// --- Types ---
interface GanttChartProps {
  materials: CurriculumMaterial[]
  phases: CurriculumPhase[]
  phaseTasks: PhaseTask[]
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
  onPhaseClick?: (phase: CurriculumPhase, materialName: string) => void
  t: (key: string) => string
}

// --- Helpers ---
function getAcademicYear(yearStr?: string): number {
  return yearStr ? parseInt(yearStr) : new Date().getFullYear()
}

/** Get the start date of each month in the academic year (April to March) */
function getMonthStarts(year: number): Date[] {
  return MONTHS.map(m => {
    const y = m >= 4 ? year : year + 1
    return new Date(y, m - 1, 1)
  })
}

/** Get the last day of March of the next year (end of academic year) */
function getAcademicYearEnd(year: number): Date {
  return new Date(year + 1, 2, 31) // March 31
}

/** Convert a date to a pixel position within the chart timeline area */
function dateToX(date: Date, academicYearStart: Date, timelineWidth: number, totalDays: number): number {
  const days = differenceInDays(date, academicYearStart)
  return Math.max(0, Math.min(timelineWidth, (days / totalDays) * timelineWidth))
}

// --- Component ---
export function GanttChart({
  materials,
  phases,
  phaseTasks,
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
  onPhaseClick,
  t,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [containerWidth, setContainerWidth] = useState(960)

  const getSubjectStyle = (subject: string) => getSubjectColor(subject)

  const year = getAcademicYear(curriculumYear)
  const academicYearStart = new Date(year, 3, 1) // April 1
  const academicYearEnd = getAcademicYearEnd(year)
  const totalDays = differenceInDays(academicYearEnd, academicYearStart) + 1
  const monthStarts = useMemo(() => getMonthStarts(year), [year])

  // Mobile responsive values
  const isMobile = containerWidth < 640
  const labelWidth = isMobile ? 120 : LABEL_WIDTH
  const rowHeight = isMobile ? 36 : ROW_HEIGHT

  // Timeline width = container width minus label column
  const timelineWidth = Math.max(containerWidth - labelWidth, 600)

  // Observe container width
  useEffect(() => {
    const el = scrollRef.current?.parentElement
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Group materials by subject
  const grouped = useMemo(() => {
    const g: Record<string, CurriculumMaterial[]> = {}
    materials.forEach(m => {
      if (!g[m.subject]) g[m.subject] = []
      g[m.subject].push(m)
    })
    Object.values(g).forEach(arr => arr.sort((a, b) => a.order_index - b.order_index))
    return g
  }, [materials])

  const subjects = Object.keys(grouped)

  const getPhases = (materialId: string) =>
    phases.filter(p => p.material_id === materialId).sort((a, b) => a.order_index - b.order_index)

  // Today line
  const todayX = useMemo(() => {
    const today = startOfDay(new Date())
    return dateToX(today, academicYearStart, timelineWidth, totalDays)
  }, [academicYearStart, timelineWidth, totalDays])

  const todayVisible = (() => {
    const today = startOfDay(new Date())
    return today >= academicYearStart && today <= academicYearEnd
  })()

  // Month column boundaries (x positions)
  const monthColumns = useMemo(() => {
    return monthStarts.map((start, i) => {
      const x = dateToX(start, academicYearStart, timelineWidth, totalDays)
      const nextStart = i < monthStarts.length - 1 ? monthStarts[i + 1] : new Date(academicYearEnd.getTime() + 86400000)
      const xEnd = dateToX(nextStart, academicYearStart, timelineWidth, totalDays)
      return { x, width: xEnd - x, label: MONTH_LABELS[i] }
    })
  }, [monthStarts, academicYearStart, timelineWidth, totalDays, academicYearEnd])

  // Build row list
  type Row = { type: 'subject'; subject: string } | { type: 'material'; subject: string; material: CurriculumMaterial }
  const rows: Row[] = []
  subjects.forEach(subject => {
    rows.push({ type: 'subject', subject })
    grouped[subject].forEach(material => {
      rows.push({ type: 'material', subject, material })
    })
  })

  // Total body height
  const bodyHeight = EXAM_ROW_HEIGHT + rows.reduce((h, r) =>
    h + (r.type === 'subject' ? SUBJECT_HEADER_HEIGHT : rowHeight), 0)

  // Render a phase bar
  function renderPhaseBar(phase: CurriculumPhase, mat: CurriculumMaterial) {
    if (!phase.start_date || !phase.end_date) return null
    const x1 = dateToX(new Date(phase.start_date), academicYearStart, timelineWidth, totalDays)
    const x2 = dateToX(new Date(phase.end_date), academicYearStart, timelineWidth, totalDays)
    const barWidth = Math.max(20, x2 - x1)
    const color = getSubjectStyle(mat.subject).color
    const isCompleted = phase.status === 'completed'
    const isInProgress = phase.status === 'in_progress'

    // Task progress
    const tasks = phaseTasks.filter(pt => pt.phase_id === phase.id)
    const taskProgress = tasks.length > 0
      ? Math.round(tasks.filter(pt => pt.is_completed).length / tasks.length * 100)
      : null

    // Text color: for light bars (like yellow #F1C232), use dark text
    const isLightColor = ['#F1C232', '#FDE047', '#FBBF24', '#D97706'].includes(color)
    const textColor = isLightColor ? '#7C4A03' : '#FFFFFF'

    return (
      <div
        key={phase.id}
        className={`absolute flex flex-col rounded cursor-pointer transition-opacity hover:opacity-100 overflow-hidden ${
          isCompleted ? 'opacity-100' : isInProgress ? 'opacity-90' : 'opacity-60'
        }`}
        style={{
          left: x1,
          width: barWidth,
          height: 20,
          top: 12,
          backgroundColor: color,
          zIndex: 5,
        }}
        onClick={() => {
          if (onPhaseClick) {
            onPhaseClick(phase, mat.material_name)
          } else {
            onEditPhase(phase)
          }
        }}
        title={`${phase.phase_name}${phase.total_hours ? ` (${phase.total_hours}h)` : ''}${taskProgress !== null ? ` - ${taskProgress}%` : ''}`}
      >
        <div className="flex items-center flex-1 min-h-0">
          <span
            className={`${isMobile ? 'text-[8px]' : 'text-[9px]'} font-semibold truncate leading-tight pl-2 pr-1`}
            style={{ color: textColor }}
          >
            {phase.phase_name}
            {taskProgress !== null && barWidth > 60 && (
              <span className="ml-1 opacity-80">{taskProgress}%</span>
            )}
          </span>
          {isCompleted && (
            <CheckCircle className="w-3 h-3 shrink-0 mr-1" style={{ color: '#10B981' }} />
          )}
        </div>
        {taskProgress !== null && (
          <div className="w-full" style={{ height: 2, backgroundColor: 'rgba(0,0,0,0.15)' }}>
            <div
              style={{
                height: 2,
                width: `${taskProgress}%`,
                backgroundColor: '#10B981',
              }}
            />
          </div>
        )}
      </div>
    )
  }

  // Render exam markers on the exam row
  function renderExamMarkers() {
    // Group exams by approximate position to stagger overlapping ones
    const markers = exams.map(exam => {
      const examDate = new Date(exam.exam_date)
      const x = dateToX(examDate, academicYearStart, timelineWidth, totalDays)
      const color = EXAM_CATEGORY_COLORS[exam.exam_category] || '#6B7280'
      const bgColor = color + '20'
      const label = exam.exam_name.length > 6 ? exam.exam_name.slice(0, 6) + '…' : exam.exam_name
      return { exam, x, color, bgColor, label, date: format(examDate, 'M/d') }
    })

    // Simple stagger: alternate y positions
    return markers.map((m, i) => {
      const yOffset = i % 2 === 0 ? 2 : 22
      return (
        <div
          key={m.exam.id}
          className="absolute flex items-center gap-1 rounded text-[9px] font-semibold whitespace-nowrap px-1.5 py-0.5 cursor-pointer hover:opacity-80"
          style={{
            left: m.x,
            top: yOffset,
            backgroundColor: m.bgColor,
            color: m.color,
            zIndex: 10,
          }}
          title={`${m.exam.exam_name}${m.exam.method ? ` (${m.exam.method})` : ''} - ${m.date}`}
        >
          {m.label} {m.date}
        </div>
      )
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" ref={scrollRef}>
      {/* Header + Month columns */}
      <div className="flex" style={{ height: HEADER_HEIGHT }}>
        {/* Label column header */}
        <div
          className="flex flex-col justify-center px-4 border-r border-border shrink-0"
          style={{ width: labelWidth }}
        >
          <span className="text-[11px] font-bold text-muted-foreground tracking-wider">教材 / 科目</span>
          <span className="text-[10px] text-muted-foreground">{year}年度（{year}.4〜{year + 1}.3）</span>
        </div>
        {/* Month headers */}
        <div className="flex flex-1 relative">
          {monthColumns.map((mc, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[11px] font-semibold text-muted-foreground border-r border-border/50 last:border-r-0"
              style={{ width: mc.width }}
            >
              {mc.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="flex border-t border-border">
        {/* Left labels */}
        <div className="shrink-0 border-r border-border" style={{ width: labelWidth }}>
          {/* Exam row label */}
          <div
            className="flex items-center gap-1.5 px-4 border-b border-border"
            style={{ height: EXAM_ROW_HEIGHT, backgroundColor: '#FEF2F2' }}
          >
            <span className="text-[11px] font-bold text-red-500">{t('examScheduleLabel')}</span>
          </div>
          {/* Material/Subject labels */}
          {rows.map((row, idx) => {
            if (row.type === 'subject') {
              const sc = getSubjectStyle(row.subject)
              return (
                <div
                  key={`label-${idx}`}
                  className="flex items-center gap-1.5 px-4 border-b border-border"
                  style={{ height: SUBJECT_HEADER_HEIGHT, backgroundColor: sc.bg }}
                >
                  <span className="text-xs font-bold" style={{ color: sc.color }}>{row.subject}</span>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0 rounded"
                    style={{ backgroundColor: sc.color + '15', color: sc.color }}
                  >
                    {grouped[row.subject].length}教材
                  </span>
                </div>
              )
            }
            const mat = row.material
            return (
              <div
                key={`label-${idx}`}
                className="flex items-center justify-between px-4 border-b border-border hover:bg-muted/30 transition-colors group/row"
                style={{ height: rowHeight }}
                onMouseEnter={() => setHoveredRow(mat.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="min-w-0 flex-1">
                  <div className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} font-semibold text-foreground truncate`}>{mat.material_name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">
                    {getPhases(mat.id).map(p => p.phase_name).join('→')}
                  </div>
                </div>
                {hoveredRow === mat.id && (
                  <div className="flex gap-0.5 shrink-0 ml-1">
                    <button className="p-0.5 rounded hover:bg-muted" onClick={() => onAddPhase(mat.id)}><Plus className="w-3 h-3 text-muted-foreground" /></button>
                    <button className="p-0.5 rounded hover:bg-muted" onClick={() => onEditMaterial(mat)}><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                    <button className="p-0.5 rounded hover:bg-muted" onClick={() => onDeleteMaterial(mat.id)}><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Timeline area */}
        <div className="flex-1 relative overflow-x-auto">
          <div style={{ width: timelineWidth, position: 'relative', height: bodyHeight }}>
            {/* Month vertical lines */}
            {monthColumns.map((mc, i) => (
              <div
                key={`ml-${i}`}
                className="absolute top-0 bottom-0 border-r"
                style={{ left: mc.x + mc.width, borderColor: '#E5E7EB50' }}
              />
            ))}

            {/* Label separator line */}
            <div className="absolute top-0 bottom-0 w-px bg-border" style={{ left: 0 }} />

            {/* Exam markers row */}
            <div
              className="relative border-b border-border"
              style={{ height: EXAM_ROW_HEIGHT, backgroundColor: '#FEF2F2' }}
            >
              {renderExamMarkers()}
            </div>

            {/* Material rows */}
            {(() => {
              let yOffset = EXAM_ROW_HEIGHT
              return rows.map((row, idx) => {
                const h = row.type === 'subject' ? SUBJECT_HEADER_HEIGHT : rowHeight
                const y = yOffset
                yOffset += h

                if (row.type === 'subject') {
                  const sc = getSubjectStyle(row.subject)
                  return (
                    <div
                      key={`row-${idx}`}
                      className="absolute left-0 right-0 border-b border-border"
                      style={{ top: y, height: h, backgroundColor: sc.bg }}
                    />
                  )
                }

                const mat = row.material
                return (
                  <div
                    key={`row-${idx}`}
                    className="absolute left-0 right-0 border-b border-border"
                    style={{ top: y, height: h }}
                  >
                    {getPhases(mat.id).map(phase => renderPhaseBar(phase, mat))}
                  </div>
                )
              })
            })()}

            {/* Today line */}
            {todayVisible && (
              <>
                <div
                  className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: todayX, height: bodyHeight }}
                />
                <div
                  className="absolute z-20 pointer-events-none rounded bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5"
                  style={{ left: todayX - 14, top: -14 }}
                >
                  今日
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty state or Add material button */}
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-t">
          <p className="text-sm mb-3">{t('emptyGantt')}</p>
          <Button size="sm" onClick={onAddMaterial}>
            <Plus className="w-4 h-4 mr-1" />{t('addMaterial')}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-2 border-t border-border">
          <button
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded hover:bg-muted/50"
            onClick={onAddMaterial}
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addMaterial')}
          </button>
        </div>
      )}
    </div>
  )
}
