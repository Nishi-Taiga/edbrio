'use client'

import { StudentProfile, CurriculumMaterial, CurriculumPhase, ExamSchedule, PhaseTask } from '@/lib/types/database'
import { differenceInDays } from 'date-fns'

// Avatar color for each student (cycle through)
const AVATAR_COLORS = ['#0C5394', '#45818E', '#8E7CC3', '#F1C232', '#BE123C', '#059669']

interface StudentInfoBarProps {
  profile: StudentProfile
  materials: CurriculumMaterial[]
  phases: CurriculumPhase[]
  exams: ExamSchedule[]
  phaseTasks?: PhaseTask[]
  colorIndex?: number
}

export function StudentInfoBar({ profile, materials, phases, exams, phaseTasks, colorIndex = 0 }: StudentInfoBarProps) {
  const today = new Date()
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]

  // Subject progress calculation
  const subjectProgress = (() => {
    const subjects = new Map<string, { total: number; completed: number }>()
    materials.forEach(m => {
      if (!subjects.has(m.subject)) subjects.set(m.subject, { total: 0, completed: 0 })
    })

    // Build a map of phase IDs per subject
    const subjectPhaseIds = new Map<string, string[]>()
    phases.forEach(p => {
      const material = materials.find(m => m.id === p.material_id)
      if (!material) return
      const entry = subjects.get(material.subject)
      if (!entry) return
      entry.total++
      if (p.status === 'completed') entry.completed++
      const ids = subjectPhaseIds.get(material.subject) || []
      ids.push(p.id)
      subjectPhaseIds.set(material.subject, ids)
    })

    return Array.from(subjects.entries()).map(([subject, data]) => {
      // If phaseTasks are provided, check for task-based progress
      if (phaseTasks && phaseTasks.length > 0) {
        const phaseIds = subjectPhaseIds.get(subject) || []
        const tasksForSubject = phaseTasks.filter(t => phaseIds.includes(t.phase_id))
        if (tasksForSubject.length > 0) {
          const completedTasks = tasksForSubject.filter(t => t.is_completed).length
          return {
            subject,
            pct: Math.round((completedTasks / tasksForSubject.length) * 100),
          }
        }
      }
      // Fallback to phase-based calculation
      return {
        subject,
        pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }
    })
  })()

  // Overall progress
  const totalPhases = phases.length
  const completedPhases = phases.filter(p => p.status === 'completed').length
  const overallPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  // Days until next exam
  const nextExam = exams
    .filter(e => new Date(e.exam_date) >= today)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())[0]
  const daysUntilExam = nextExam ? differenceInDays(new Date(nextExam.exam_date), today) : null

  const nameInitial = profile.name[0] || '?'
  const metaParts: string[] = []
  if (profile.curriculum_year) metaParts.push(`${profile.curriculum_year}年度`)
  if (profile.curriculum_title) metaParts.push(profile.curriculum_title)
  if (profile.grade) metaParts.push(profile.grade)
  const metaText = metaParts.join(' ・ ')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl bg-[#2D1B4E] dark:bg-[#1A1230] px-4 sm:px-6 py-4 w-full">
      {/* Left: Avatar + Name */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: `linear-gradient(180deg, ${avatarColor} 0%, ${avatarColor}99 100%)` }}
        >
          {nameInitial}
        </div>
        <div className="min-w-0">
          <div className="text-white font-bold text-lg leading-tight truncate">{profile.name}</div>
          {metaText && (
            <div className="text-[#D4BEE4] text-xs mt-0.5 truncate">{metaText}</div>
          )}
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-6 sm:ml-auto">
        {subjectProgress.map(sp => (
          <div key={sp.subject} className="flex flex-col items-center bg-white/[0.07] rounded-[10px] px-3 sm:px-5 py-2 sm:py-2.5 min-w-[56px] sm:min-w-[70px]">
            <span className="text-[#D4BEE4] text-[10px] font-medium tracking-wider">{sp.subject}</span>
            <span className="text-white text-[22px] font-extrabold leading-tight">{sp.pct}%</span>
          </div>
        ))}
        <div className="flex flex-col items-center bg-white/[0.07] rounded-[10px] px-3 sm:px-5 py-2 sm:py-2.5 min-w-[56px] sm:min-w-[70px]">
          <span className="text-[#D4BEE4] text-[10px] font-medium tracking-wider">総合進捗</span>
          <span className="text-[#10B981] text-[22px] font-extrabold leading-tight">{overallPct}%</span>
        </div>
        {daysUntilExam !== null && (
          <div className="flex flex-col items-center bg-white/[0.07] rounded-[10px] px-3 sm:px-5 py-2 sm:py-2.5 min-w-[56px] sm:min-w-[70px]">
            <span className="text-[#D4BEE4] text-[10px] font-medium tracking-wider">試験まで</span>
            <span className="text-[#F59E0B] text-[22px] font-extrabold leading-tight">{daysUntilExam}日</span>
          </div>
        )}
      </div>
    </div>
  )
}
