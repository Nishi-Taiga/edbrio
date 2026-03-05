"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  labels: {
    weekView: string
    monthView: string
    booked: string
    needsReport: string
    done: string
    noEvents: string
  }
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

const DOT_COLOR: Record<string, string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-emerald-500',
}

const EVENT_LIGHT_BG: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40',
  red: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800/40',
  green: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40',
}

/** Build weeks (Sun–Sat rows) for a month. No extra trailing week. */
function getMonthWeeks(year: number, month: number): Date[][] {
  const lastDay = new Date(year, month + 1, 0)
  const cur = new Date(year, month, 1)
  cur.setDate(cur.getDate() - cur.getDay()) // back to Sunday

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
  return weeks
}

export function TeacherDashboardCalendar({ events, labels }: Props) {
  const [view, setView] = useState<'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const timelineRef = useRef<HTMLDivElement>(null)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const k = format(e.start, 'yyyy-MM-dd')
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(e)
    }
    return map
  }, [events])

  const weeks = useMemo(
    () => getMonthWeeks(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  )

  const selectedDayEvents = useMemo(() => {
    const k = format(selectedDate, 'yyyy-MM-dd')
    return (eventsByDate.get(k) || []).sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    )
  }, [selectedDate, eventsByDate])

  // Scroll day timeline to 10:00
  useEffect(() => {
    if (timelineRef.current && view === 'week') {
      timelineRef.current.scrollTop = 4 * 40 // (10 − 6) × 40 px
    }
  }, [selectedDate, view])

  const prevMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  /** Unique event-color flags for a date */
  const dotsFor = (date: Date) => {
    const evts = eventsByDate.get(format(date, 'yyyy-MM-dd'))
    if (!evts) return null
    const s = new Set(evts.map((e) => e.color))
    return { blue: s.has('blue'), red: s.has('red'), green: s.has('green') }
  }

  /* ── Shared day-name header ── */
  const dayNameRow = (extraCls?: string) => (
    <div className={cn('grid grid-cols-7', extraCls)}>
      {DAY_NAMES.map((name, i) => (
        <div
          key={name}
          className={cn(
            'text-center text-[11px] font-medium py-1.5',
            i === 0 && 'text-red-500',
            i === 6 && 'text-blue-500',
            i > 0 && i < 6 && 'text-muted-foreground',
          )}
        >
          {name}
        </div>
      ))}
    </div>
  )

  /* ── Shared dot indicators ── */
  const dotsIndicator = (
    dots: { blue: boolean; red: boolean; green: boolean },
    size: string,
  ) => (
    <div className="flex gap-[3px] mt-0.5">
      {dots.blue && (
        <span className={cn('rounded-full bg-blue-500', size)} />
      )}
      {dots.red && (
        <span className={cn('rounded-full bg-red-500', size)} />
      )}
      {dots.green && (
        <span className={cn('rounded-full bg-emerald-500', size)} />
      )}
    </div>
  )

  /* ── Timeline constants ── */
  const HOUR_H = 40
  const START_H = 6
  const END_H = 22
  const HOURS = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i)

  return (
    <div>
      {/* ── Header: month nav + view toggle ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={prevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[100px] text-center">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={nextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {(['week', 'month'] as const).map((v) => (
            <button
              key={v}
              className={cn(
                'px-3 py-1.5 font-medium transition-colors',
                view === v ? 'bg-brand-600 text-white' : 'hover:bg-muted',
              )}
              onClick={() => setView(v)}
            >
              {v === 'week' ? labels.weekView : labels.monthView}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 text-xs mb-3">
        {[
          { cls: 'bg-blue-500', label: labels.booked },
          { cls: 'bg-red-500', label: labels.needsReport },
          { cls: 'bg-emerald-500', label: labels.done },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', l.cls)} />
            <span className="text-muted-foreground">{l.label}</span>
          </span>
        ))}
      </div>

      {/* ═══ WEEK VIEW ═══ */}
      {view === 'week' ? (
        <>
          {/* Mini month calendar */}
          <div className="rounded-lg bg-muted/30 dark:bg-muted/10 p-2 mb-3">
            {dayNameRow()}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  const inMonth =
                    day.getMonth() === currentMonth.getMonth()
                  const isToday = isSameDay(day, today)
                  const isSelected = isSameDay(day, selectedDate)
                  const dots = dotsFor(day)
                  return (
                    <button
                      key={di}
                      onClick={() => setSelectedDate(new Date(day))}
                      className={cn(
                        'flex flex-col items-center py-1 rounded transition-colors',
                        !inMonth && 'opacity-30',
                        isSelected && !isToday && 'bg-brand-100 dark:bg-brand-900/40',
                      )}
                    >
                      <span
                        className={cn(
                          'w-6 h-6 flex items-center justify-center rounded-full text-xs',
                          isToday && 'bg-brand-600 text-white font-bold',
                          !isToday && di === 0 && 'text-red-500',
                          !isToday && di === 6 && 'text-blue-500',
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {inMonth && dots && dotsIndicator(dots, 'w-1 h-1')}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Selected day header */}
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            {format(selectedDate, 'M月d日（E）', { locale: ja })}
          </h3>

          {/* Day timeline */}
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {labels.noEvents}
            </p>
          ) : (
            <div
              ref={timelineRef}
              className="overflow-y-auto rounded-lg bg-muted/30 dark:bg-muted/10"
              style={{ maxHeight: 10 * HOUR_H }}
            >
              <div
                className="relative"
                style={{ height: (END_H - START_H) * HOUR_H }}
              >
                {/* Hour markers */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-muted/40"
                    style={{ top: (h - START_H) * HOUR_H }}
                  >
                    <span className="text-[10px] text-muted-foreground/60 px-2 leading-none">
                      {h}:00
                    </span>
                  </div>
                ))}
                {/* Events */}
                {selectedDayEvents.map((ev) => {
                  const sH =
                    ev.start.getHours() + ev.start.getMinutes() / 60
                  const eH =
                    ev.end.getHours() + ev.end.getMinutes() / 60
                  const top = Math.max(0, (sH - START_H) * HOUR_H)
                  const height = Math.max(24, (eH - sH) * HOUR_H)
                  return (
                    <div
                      key={ev.id}
                      className={cn(
                        'absolute left-10 right-2 rounded-md border px-2 py-1',
                        EVENT_LIGHT_BG[ev.color],
                      )}
                      style={{ top, height }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            DOT_COLOR[ev.color],
                          )}
                        />
                        <span className="text-xs font-medium truncate">
                          {ev.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-3.5">
                        {format(ev.start, 'H:mm')} – {format(ev.end, 'H:mm')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ═══ MONTH VIEW ═══ */
        <div className="rounded-lg overflow-hidden border border-muted/30">
          {dayNameRow('bg-muted/50 dark:bg-muted/20')}
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-t border-muted/30"
            >
              {week.map((day, di) => {
                const inMonth =
                  day.getMonth() === currentMonth.getMonth()
                const isToday = isSameDay(day, today)
                const dots = dotsFor(day)
                return (
                  <button
                    key={di}
                    onClick={() => {
                      setSelectedDate(new Date(day))
                      setView('week')
                    }}
                    className={cn(
                      'flex flex-col items-center py-2 min-h-[52px] transition-colors',
                      'bg-background/50 dark:bg-muted/5 hover:bg-muted/30',
                      !inMonth && 'opacity-30',
                      di < 6 && 'border-r border-muted/30',
                    )}
                  >
                    <span
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                        isToday && 'bg-brand-600 text-white font-bold',
                        !isToday && di === 0 && 'text-red-500',
                        !isToday && di === 6 && 'text-blue-500',
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {inMonth && dots && dotsIndicator(dots, 'w-1.5 h-1.5')}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
