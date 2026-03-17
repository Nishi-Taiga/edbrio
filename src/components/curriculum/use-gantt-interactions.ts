'use client'

import { useState, useCallback, useRef } from 'react'

export type GanttDragState =
  | { type: 'create'; materialId: string; startX: number; currentX: number }
  | { type: 'resize'; phaseId: string; edge: 'left' | 'right'; origLeft: number; origRight: number; deltaX: number }
  | { type: 'move'; phaseId: string; origLeft: number; barWidth: number; deltaX: number }
  | null

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

export function useGanttInteractions(
  timelineRef: React.RefObject<HTMLDivElement | null>,
  timelineWidth: number,
  totalDays: number,
  academicYearStart: Date,
  onUpdatePhase: (id: string, updates: { start_date?: string; end_date?: string }) => Promise<void>,
  onAddPhase: (materialId: string, startDate?: string, endDate?: string) => void,
) {
  const [dragState, setDragState] = useState<GanttDragState>(null)
  const skipClickRef = useRef(false)

  // Keep latest callbacks in refs to avoid stale closures
  const updatePhaseRef = useRef(onUpdatePhase)
  updatePhaseRef.current = onUpdatePhase
  const addPhaseRef = useRef(onAddPhase)
  addPhaseRef.current = onAddPhase

  const getX = useCallback((clientX: number): number => {
    const el = timelineRef.current
    if (!el) return 0
    return clientX - el.getBoundingClientRect().left + el.scrollLeft
  }, [timelineRef])

  const xToDate = useCallback((x: number): string => {
    const cx = clamp(x, 0, timelineWidth)
    const days = Math.round((cx / timelineWidth) * totalDays)
    const d = new Date(academicYearStart)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }, [timelineWidth, totalDays, academicYearStart])

  /** Click/drag on empty timeline space to create a new phase */
  const handleRowMouseDown = useCallback((e: React.MouseEvent, materialId: string) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-phase-bar]')) return
    e.preventDefault()
    const startX = getX(e.clientX)
    setDragState({ type: 'create', materialId, startX, currentX: startX })

    const onMove = (me: MouseEvent) => {
      me.preventDefault()
      setDragState(prev => prev?.type === 'create' ? { ...prev, currentX: getX(me.clientX) } : prev)
    }
    const onUp = (me: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const endX = getX(me.clientX)
      setDragState(null)
      const lo = Math.min(startX, endX)
      const hi = Math.max(startX, endX)
      if (hi - lo > 5) {
        addPhaseRef.current(materialId, xToDate(lo), xToDate(hi))
      } else {
        const d = xToDate(endX)
        const end = new Date(d)
        end.setDate(end.getDate() + 14)
        addPhaseRef.current(materialId, d, end.toISOString().slice(0, 10))
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [getX, xToDate])

  /** Drag phase edge to resize */
  const handleEdgeMouseDown = useCallback((
    e: React.MouseEvent, phaseId: string, edge: 'left' | 'right',
    origLeft: number, origRight: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const startClientX = e.clientX
    setDragState({ type: 'resize', phaseId, edge, origLeft, origRight, deltaX: 0 })

    const onMove = (me: MouseEvent) => {
      me.preventDefault()
      const delta = me.clientX - startClientX
      setDragState(prev => prev?.type === 'resize' ? { ...prev, deltaX: delta } : prev)
    }
    const onUp = (me: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const delta = me.clientX - startClientX
      setDragState(null)
      if (Math.abs(delta) < 3) return
      skipClickRef.current = true
      setTimeout(() => { skipClickRef.current = false }, 50)
      if (edge === 'left') {
        const newLeft = clamp(origLeft + delta, 0, origRight - 10)
        updatePhaseRef.current(phaseId, { start_date: xToDate(newLeft) })
      } else {
        const newRight = clamp(origRight + delta, origLeft + 10, timelineWidth)
        updatePhaseRef.current(phaseId, { end_date: xToDate(newRight) })
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [xToDate, timelineWidth])

  /** Drag phase bar to move */
  const handleBarMouseDown = useCallback((
    e: React.MouseEvent, phaseId: string, origLeft: number, barWidth: number,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const startClientX = e.clientX
    let hasMoved = false
    setDragState({ type: 'move', phaseId, origLeft, barWidth, deltaX: 0 })

    const onMove = (me: MouseEvent) => {
      me.preventDefault()
      const delta = me.clientX - startClientX
      if (Math.abs(delta) > 3) hasMoved = true
      setDragState(prev => prev?.type === 'move' ? { ...prev, deltaX: delta } : prev)
    }
    const onUp = (me: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setDragState(null)
      if (!hasMoved) return // Just a click, let onClick fire normally
      skipClickRef.current = true
      setTimeout(() => { skipClickRef.current = false }, 50)
      const delta = me.clientX - startClientX
      const newLeft = clamp(origLeft + delta, 0, timelineWidth - barWidth)
      updatePhaseRef.current(phaseId, {
        start_date: xToDate(newLeft),
        end_date: xToDate(newLeft + barWidth),
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [xToDate, timelineWidth])

  /** Compute visual bounds for a phase during drag (resize or move) */
  const getVisualBounds = useCallback((phaseId: string, defaultLeft: number, defaultWidth: number): { left: number; width: number } => {
    const s = dragState
    if (!s) return { left: defaultLeft, width: defaultWidth }

    if (s.type === 'resize' && s.phaseId === phaseId) {
      if (s.edge === 'left') {
        const newLeft = clamp(s.origLeft + s.deltaX, 0, s.origRight - 10)
        return { left: newLeft, width: s.origRight - newLeft }
      }
      const newRight = clamp(s.origRight + s.deltaX, s.origLeft + 10, timelineWidth)
      return { left: s.origLeft, width: newRight - s.origLeft }
    }

    if (s.type === 'move' && s.phaseId === phaseId) {
      const newLeft = clamp(s.origLeft + s.deltaX, 0, timelineWidth - s.barWidth)
      return { left: newLeft, width: s.barWidth }
    }

    return { left: defaultLeft, width: defaultWidth }
  }, [dragState, timelineWidth])

  /** Creation preview bar position */
  const createPreview = dragState?.type === 'create' ? {
    materialId: dragState.materialId,
    left: Math.min(dragState.startX, dragState.currentX),
    width: Math.max(Math.abs(dragState.currentX - dragState.startX), 2),
  } : null

  return {
    dragState,
    skipClickRef,
    handleRowMouseDown,
    handleEdgeMouseDown,
    handleBarMouseDown,
    getVisualBounds,
    createPreview,
  }
}
