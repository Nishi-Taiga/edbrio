'use client'

import { useState, useCallback, useRef } from 'react'

export type GanttDragState =
  | { type: 'create'; materialId: string; startX: number; currentX: number }
  | { type: 'resize'; phaseId: string; edge: 'left' | 'right'; origLeft: number; origRight: number; deltaX: number }
  | { type: 'move'; phaseId: string; origLeft: number; barWidth: number; deltaX: number }
  | null

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

/**
 * Gantt drag interactions in week-index space.
 *
 * Pixel positions on the timeline are mapped to 1-based week indices
 * relative to the academic year, matching the storage format on
 * curriculum_phases.start_week / end_week. The hook never touches dates.
 */
export function useGanttInteractions(
  timelineRef: React.RefObject<HTMLDivElement | null>,
  timelineWidth: number,
  totalWeeks: number,
  onUpdatePhase: (id: string, updates: { start_week?: number; end_week?: number }) => Promise<void>,
  onAddPhase: (materialId: string, startWeek?: number, endWeek?: number) => void,
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

  /** Pixel offset → 1-based week index (snaps to nearest week, clamped). */
  const xToWeek = useCallback((x: number): number => {
    const cx = clamp(x, 0, timelineWidth)
    const week = Math.round((cx / timelineWidth) * totalWeeks) + 1
    return clamp(week, 1, totalWeeks)
  }, [timelineWidth, totalWeeks])

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
        addPhaseRef.current(materialId, xToWeek(lo), xToWeek(hi))
      } else {
        // Click: default to a 2-week phase from the click point
        const start = xToWeek(endX)
        const end = clamp(start + 1, 1, totalWeeks)
        addPhaseRef.current(materialId, start, end)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [getX, xToWeek, totalWeeks])

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
        updatePhaseRef.current(phaseId, { start_week: xToWeek(newLeft) })
      } else {
        const newRight = clamp(origRight + delta, origLeft + 10, timelineWidth)
        updatePhaseRef.current(phaseId, { end_week: xToWeek(newRight) })
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [xToWeek, timelineWidth])

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
        start_week: xToWeek(newLeft),
        end_week: xToWeek(newLeft + barWidth),
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [xToWeek, timelineWidth])

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
    xToWeek,
  }
}
