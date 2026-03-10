"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { format, isSameDay, startOfWeek, addDays, addMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  color: 'blue' | 'red' | 'green'
}

interface Props {
  events: CalendarEvent[]
  title: string
  labels: {
    weekView: string
    monthView: string
    booked: string
    needsReport: string
    done: string
    noEvents: string
  }
  onEventClick?: (eventId: string) => void
  weekStartsOn?: 0 | 1
}

const DAY_NAMES_MON = ['月', '火', '水', '木', '金', '土', '日']
const DAY_NAMES_SUN = ['日', '月', '火', '水', '木', '金', '土']

const ACCENT_COLOR: Record<string, string> = {
  blue: 'bg-[#3B82F6]',
  red: 'bg-[#EF4444]',
  green: 'bg-[#10B981]',
}

const SUBJECT_COLOR: Record<string, string> = {
  blue: 'text-[#3B82F6]',
  red: 'text-[#EF4444]',
  green: 'text-[#10B981]',
}

const HOUR_H = 31
const START_H = 9
const END_H = 22
const HOURS = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i)
const TIME_COL = 36

function getWeekStart(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  return startOfWeek(date, { weekStartsOn })
}

function getMonthWeeks(year: number, month: number, weekStartsOn: 0 | 1 = 0): Date[][] {
  const lastDay = new Date(year, month + 1, 0)
  const cur = getWeekStart(new Date(year, month, 1), weekStartsOn)
  const weeks: Date[][] = []
  while (true) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur > lastDay) break
  }
  // Cap at 5 weeks: drop the last row if it has fewer in-month days
  if (weeks.length > 5) {
    const firstInMonth = weeks[0].filter(d => d.getMonth() === month).length
    const lastInMonth = weeks[weeks.length - 1].filter(d => d.getMonth() === month).length
    if (lastInMonth <= firstInMonth) {
      weeks.pop()
    } else {
      weeks.shift()
    }
  }
  return weeks
}

/* ── Compact mini month calendar ── */
function MiniCal({
  month,
  today,
  onSelectDate,
  weekStartsOn = 0,
}: {
  month: Date
  today: Date
  onSelectDate: (d: Date) => void
  weekStartsOn?: 0 | 1
}) {
  const weeks = useMemo(
    () => getMonthWeeks(month.getFullYear(), month.getMonth(), weekStartsOn),
    [month, weekStartsOn],
  )
  const dayNames = weekStartsOn === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN

  return (
    <div className="flex flex-col gap-[6px] px-1 py-2">
      <span className="text-[11px] font-semibold text-center text-gray-800 dark:text-[#E8E4F0]">
        {format(month, 'M月 yyyy', { locale: ja })}
      </span>
      <div className="flex justify-between w-[92px] mx-auto">
        {dayNames.map((n) => {
          const isSat = n === '土'
          const isSun = n === '日'
          return (
            <span
              key={n}
              className={cn(
                'text-[9px] font-medium w-[13px] text-center',
                isSat && 'text-[#3B82F6]',
                isSun && 'text-[#EF4444]',
                !isSat && !isSun && 'text-gray-400 dark:text-[#6D5A8A]',
              )}
            >
              {n}
            </span>
          )
        })}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex justify-between w-[92px] mx-auto">
          {week.map((day, di) => {
            const inMonth = day.getMonth() === month.getMonth()
            const isTd = isSameDay(day, today)
            const dayOfWeek = day.getDay()
            const isSat = dayOfWeek === 6
            const isSun = dayOfWeek === 0
            return (
              <button
                key={di}
                onClick={() => inMonth && onSelectDate(day)}
                className="w-[13px] h-[13px] flex items-center justify-center relative"
              >
                {isTd && (
                  <span className="absolute w-[14px] h-[14px] rounded-full bg-[#2D1B4E] dark:bg-[#A78BFA]" />
                )}
                <span
                  className={cn(
                    'relative text-[9px] leading-none',
                    !inMonth && 'invisible',
                    isTd && 'text-white font-bold',
                    !isTd && isSat && 'text-[#3B82F6]',
                    !isTd && isSun && 'text-[#EF4444]',
                    !isTd && !isSat && !isSun && 'text-gray-500 dark:text-[#6D5A8A]',
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function TeacherDashboardCalendar({ events, title, labels, onEventClick, weekStartsOn = 0 }: Props) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const gridRef = useRef<HTMLDivElement>(null)

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const weekStart = useMemo(() => getWeekStart(currentDate, weekStartsOn), [currentDate, weekStartsOn])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const curMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate],
  )
  const nxtMonth = useMemo(() => addMonths(curMonth, 1), [curMonth])

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const k = format(e.start, 'yyyy-MM-dd')
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(e)
    }
    return m
  }, [events])

  const monthWeeks = useMemo(
    () => getMonthWeeks(curMonth.getFullYear(), curMonth.getMonth(), weekStartsOn),
    [curMonth, weekStartsOn],
  )

  // Scroll to ~10:00 on mount / week change
  useEffect(() => {
    if (gridRef.current && view === 'week') {
      gridRef.current.scrollTop = (10 - START_H) * HOUR_H
    }
  }, [view, weekStart])

  const eventsForDay = (day: Date) => {
    const k = format(day, 'yyyy-MM-dd')
    return (eventsByDate.get(k) || []).sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  const dotsFor = (d: Date) => {
    const e = eventsByDate.get(format(d, 'yyyy-MM-dd'))
    if (!e) return null
    const s = new Set(e.map(x => x.color))
    return { blue: s.has('blue'), red: s.has('red'), green: s.has('green') }
  }

  const colLeft = (i: number) =>
    `calc(${TIME_COL}px + (100% - ${TIME_COL}px) / 7 * ${i})`
  const colWidth = `calc((100% - ${TIME_COL}px) / 7)`

  return (
    <div className="flex flex-col h-full">
      {/* Header: title + tabs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-[#E8E4F0]">{title}</h2>
        <div className="flex rounded-lg overflow-hidden border border-[#D4BEE4] dark:border-[#6D5A8A]">
          {(['week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-[7px] text-[13px] font-medium transition-colors',
                view === v
                  ? 'bg-[#2D1B4E] dark:bg-[#282237] text-white dark:text-[#E8E4F0]'
                  : 'bg-white dark:bg-[#1E1A2B] text-gray-400 dark:text-[#9CA3AF]',
              )}
            >
              {v === 'week' ? labels.weekView : labels.monthView}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs mb-3">
        {[
          { cls: 'bg-blue-500', label: labels.booked },
          { cls: 'bg-emerald-500', label: labels.done },
          { cls: 'bg-red-500', label: labels.needsReport },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', l.cls)} />
            <span className="text-gray-400 dark:text-[#6D5A8A]">{l.label}</span>
          </span>
        ))}
      </div>

      {/* ═══ WEEK VIEW ═══ */}
      {view === 'week' ? (
        <div className="flex gap-3 flex-1 min-h-0">
          {/* Mini calendars — hidden on smaller screens */}
          <div className="hidden lg:flex flex-col gap-3 w-[100px] shrink-0">
            <MiniCal month={curMonth} today={today} onSelectDate={d => setCurrentDate(d)} weekStartsOn={weekStartsOn} />
            <MiniCal month={nxtMonth} today={today} onSelectDate={d => setCurrentDate(d)} weekStartsOn={weekStartsOn} />
          </div>
          <div className="hidden lg:block w-px shrink-0 bg-[#D4BEE4] dark:bg-[#2E2840]" />

          {/* Grid area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-2" style={{ paddingLeft: TIME_COL }}>
              <div className="flex items-center gap-2">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 dark:text-[#6D5A8A] hover:bg-gray-100 dark:hover:bg-[#282237] transition-colors text-sm"
                  onClick={() => setCurrentDate(prev => addDays(getWeekStart(prev, weekStartsOn), -7))}
                >
                  ‹
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-[#E8E4F0] min-w-[100px] text-center">
                  {format(weekStart, 'M/d')} – {format(addDays(weekStart, 6), 'M/d')}
                </span>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 dark:text-[#6D5A8A] hover:bg-gray-100 dark:hover:bg-[#282237] transition-colors text-sm"
                  onClick={() => setCurrentDate(prev => addDays(getWeekStart(prev, weekStartsOn), 7))}
                >
                  ›
                </button>
              </div>
              <button
                className="text-xs font-medium text-[#7C3AED] dark:text-[#A78BFA] hover:opacity-80 transition-opacity px-2 py-1 rounded-md hover:bg-[#EDE8F5] dark:hover:bg-[#282237]"
                onClick={() => setCurrentDate(new Date())}
              >
                {labels.weekView === '週' ? '今日' : 'Today'}
              </button>
            </div>
            {/* Day headers */}
            <div className="flex" style={{ paddingLeft: TIME_COL }}>
              {weekDays.map((day, i) => {
                const isTd = isSameDay(day, today)
                const dayOfWeek = day.getDay() // 0=Sun, 6=Sat
                const isSat = dayOfWeek === 6
                const isSun = dayOfWeek === 0
                const dayNames = weekStartsOn === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 py-1',
                      isTd && 'bg-[#EDE8F5] dark:bg-[#A78BFA]/[0.15] rounded-t-md',
                    )}
                  >
                    <span className={cn(
                      'text-[10px] font-medium',
                      isTd && 'text-[#2D1B4E] dark:text-[#A78BFA] font-semibold',
                      !isTd && isSat && 'text-[#3B82F6]',
                      !isTd && isSun && 'text-[#EF4444]',
                      !isTd && !isSat && !isSun && 'text-gray-400 dark:text-[#6D5A8A]',
                    )}>
                      {dayNames[i]}
                    </span>
                    {isTd ? (
                      <span className="w-[15px] h-[15px] rounded-full bg-[#2D1B4E] dark:bg-[#A78BFA] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                        {day.getDate()}
                      </span>
                    ) : (
                      <span className={cn(
                        'text-xs font-semibold',
                        isSat && 'text-[#3B82F6]',
                        isSun && 'text-[#EF4444]',
                        !isSat && !isSun && 'text-gray-600 dark:text-[#9CA3AF]',
                      )}>
                        {day.getDate()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Scrollable time grid */}
            <div
              ref={gridRef}
              className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0"
            >
              <div className="relative" style={{ height: (END_H - START_H + 1) * HOUR_H }}>
                {/* Today column background */}
                {weekDays.map((day, i) =>
                  isSameDay(day, today) ? (
                    <div
                      key={`tc${i}`}
                      className="absolute top-0 bottom-0 bg-[#EDE8F5]/70 dark:bg-[#A78BFA]/[0.12] rounded-b-md pointer-events-none"
                      style={{ left: colLeft(i), width: colWidth }}
                    />
                  ) : null,
                )}

                {/* Vertical column separators */}
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={`vs${i}`}
                    className="absolute top-0 bottom-0 w-px bg-[#D4BEE4]/50 dark:bg-[#6D5A8A]/30 pointer-events-none"
                    style={{ left: i === 0 ? `${TIME_COL}px` : colLeft(i) }}
                  />
                ))}

                {/* Hour rows */}
                {HOURS.map((h, idx) => (
                  <div key={h} className="absolute left-0 right-0" style={{ top: idx * HOUR_H }}>
                    <span className="absolute text-[9px] font-medium text-gray-400 dark:text-[#6D5A8A] w-7 text-right -top-1.5 left-0">
                      {h}
                    </span>
                    <div
                      className="absolute border-t border-[#D4BEE4] dark:border-[#6D5A8A]"
                      style={{ left: TIME_COL, right: 0 }}
                    />
                  </div>
                ))}

                {/* Event cards */}
                {weekDays.map((day, di) =>
                  eventsForDay(day).map(ev => {
                    const sH = ev.start.getHours() + ev.start.getMinutes() / 60
                    const eH = ev.end.getHours() + ev.end.getMinutes() / 60
                    const top = Math.max(0, (sH - START_H) * HOUR_H)
                    const height = Math.max(24, (eH - sH) * HOUR_H)
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          'absolute rounded-md bg-white dark:bg-[#1E1A2B] border border-[#D4BEE4] dark:border-[#6D5A8A] shadow-sm overflow-hidden z-10',
                          onEventClick && 'cursor-pointer hover:shadow-md hover:border-[#A78BFA] dark:hover:border-[#A78BFA] transition-all',
                        )}
                        style={{
                          top,
                          height,
                          left: `calc(${TIME_COL}px + (100% - ${TIME_COL}px) / 7 * ${di} + 2px)`,
                          width: `calc((100% - ${TIME_COL}px) / 7 - 4px)`,
                        }}
                        onClick={() => onEventClick?.(ev.id)}
                      >
                        <div className={cn('absolute left-[3px] top-[4px] bottom-[4px] w-[3px] rounded-sm', ACCENT_COLOR[ev.color])} />
                        <div className="pl-[10px] pt-[3px]">
                          <div className="text-[10px] font-semibold text-gray-800 dark:text-[#E8E4F0] truncate">
                            {ev.title}
                          </div>
                          <div className={cn('text-[9px]', SUBJECT_COLOR[ev.color])}>
                            {format(ev.start, 'H:mm')}–{format(ev.end, 'H:mm')}
                          </div>
                        </div>
                      </div>
                    )
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ═══ MONTH VIEW ═══ */
        <div className="flex-1">
          <div className="flex items-center justify-center gap-3 mb-3">
            <button
              className="text-lg text-gray-400 dark:text-[#6D5A8A] hover:text-gray-600 dark:hover:text-[#A78BFA]"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-[#E8E4F0] min-w-[100px] text-center">
              {format(curMonth, 'yyyy年M月', { locale: ja })}
            </span>
            <button
              className="text-lg text-gray-400 dark:text-[#6D5A8A] hover:text-gray-600 dark:hover:text-[#A78BFA]"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>

          <div className="rounded-lg overflow-hidden border border-[#D4BEE4]/30 dark:border-[#2E2840]">
            <div className="grid grid-cols-7 bg-gray-50/50 dark:bg-[#282237]/50">
              {(weekStartsOn === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN).map((n) => {
                const isSat = n === '土'
                const isSun = n === '日'
                return (
                  <div key={n} className={cn(
                    'text-center text-[11px] font-medium py-1.5',
                    isSat && 'text-[#3B82F6]',
                    isSun && 'text-[#EF4444]',
                    !isSat && !isSun && 'text-gray-400 dark:text-[#6D5A8A]',
                  )}>
                    {n}
                  </div>
                )
              })}
            </div>
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t border-[#D4BEE4]/30 dark:border-[#2E2840]">
                {week.map((day, di) => {
                  const inMonth = day.getMonth() === curMonth.getMonth()
                  const isTd = isSameDay(day, today)
                  const dots = dotsFor(day)
                  const dow = day.getDay()
                  const isSat = dow === 6
                  const isSun = dow === 0
                  return (
                    <button
                      key={di}
                      onClick={() => { setCurrentDate(day); setView('week') }}
                      className={cn(
                        'flex flex-col items-center py-2 min-h-[52px] transition-colors hover:bg-gray-50 dark:hover:bg-[#282237]/50',
                        !inMonth && 'opacity-30',
                        di < 6 && 'border-r border-[#D4BEE4]/30 dark:border-[#2E2840]',
                      )}
                    >
                      <span className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                        isTd && 'bg-[#2D1B4E] dark:bg-[#A78BFA] text-white font-bold',
                        !isTd && isSat && 'text-[#3B82F6]',
                        !isTd && isSun && 'text-[#EF4444]',
                        !isTd && !isSat && !isSun && 'text-gray-600 dark:text-[#9CA3AF]',
                      )}>
                        {day.getDate()}
                      </span>
                      {inMonth && dots && (
                        <div className="flex gap-[3px] mt-0.5">
                          {dots.blue && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {dots.green && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          {dots.red && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
