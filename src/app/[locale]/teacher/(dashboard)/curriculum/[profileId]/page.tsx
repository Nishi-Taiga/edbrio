"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { FileEdit, Download, Plus } from 'lucide-react'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useStudentCurriculum } from '@/hooks/use-student-curriculum'
import { useCurriculumMaterials } from '@/hooks/use-curriculum-materials'
import { useExamSchedules } from '@/hooks/use-exam-schedules'
import { useLessonLogs } from '@/hooks/use-lesson-logs'
import { useTestScores } from '@/hooks/use-test-scores'
import { useHandoverNotes } from '@/hooks/use-handover-notes'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile, CurriculumMaterial, CurriculumPhase, ExamSchedule, TestScore, TestType } from '@/lib/types/database'
import { StudentInfoBar } from '@/components/curriculum/student-info-bar'
import { GanttChart } from '@/components/curriculum/gantt-chart'
import { MaterialForm } from '@/components/curriculum/material-form'
import { PhaseForm } from '@/components/curriculum/phase-form'
import { ExamScheduleList } from '@/components/curriculum/exam-schedule-list'
import { ExamScheduleForm } from '@/components/curriculum/exam-schedule-form'
import { LessonLogList } from '@/components/curriculum/lesson-log-list'
import { LessonLogForm } from '@/components/curriculum/lesson-log-form'
import { TestScoreList } from '@/components/curriculum/test-score-list'
import { TestScoreForm } from '@/components/curriculum/test-score-form'
import { TestScoreChart } from '@/components/curriculum/test-score-chart'
import { GoalList } from '@/components/curriculum/goal-list'
import { GoalForm } from '@/components/curriculum/goal-form'
import { SkillList } from '@/components/curriculum/skill-list'
import { SkillForm } from '@/components/curriculum/skill-form'
import { HandoverNoteList } from '@/components/curriculum/handover-note-list'
import { HandoverNoteForm } from '@/components/curriculum/handover-note-form'
import { useTranslations } from 'next-intl'
import { LoadingButton } from '@/components/ui/loading-button'

// Avatar colors for student tabs (matching Pencil design)
const STUDENT_COLORS = ['#0C5394', '#45818E', '#8E7CC3', '#F1C232', '#BE123C', '#059669']

export default function StudentCurriculumPage() {
  const params = useParams()
  const profileId = params.profileId as string
  const router = useRouter()
  const tPage = useTranslations('curriculum.page')
  const tProfile = useTranslations('curriculum.profile')
  const tOverview = useTranslations('curriculum.overview')
  const tGantt = useTranslations('curriculum.gantt')
  const tMaterials = useTranslations('curriculum.materials')
  const tPhases = useTranslations('curriculum.phases')
  const tExams = useTranslations('curriculum.exams')
  const tLessonLogs = useTranslations('curriculum.lessonLogs')
  const tTestScores = useTranslations('curriculum.testScores')
  const tc = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const { profiles } = useStudentProfiles(user?.id)
  const { updateProfile } = useStudentProfiles(user?.id)
  const { goals, skills, loading: curriculumLoading, error: curriculumError, addGoal, updateGoal, deleteGoal, addSkill, updateSkill, deleteSkill } = useStudentCurriculum(profileId)
  const { materials, phases, loading: materialsLoading, error: materialsError, addMaterial, updateMaterial, deleteMaterial, addPhase, updatePhase, deletePhase } = useCurriculumMaterials(profileId)
  const { exams, loading: examsLoading, error: examsError, addExam, updateExam, deleteExam } = useExamSchedules(profileId)
  const { logs, logPhases, loading: logsLoading, error: logsError, addLog, deleteLog } = useLessonLogs(profileId)
  const { scores, loading: scoresLoading, error: scoresError, addScore, updateScore, deleteScore } = useTestScores(profileId)
  const { notes, loading: notesLoading, error: notesError, addNote, deleteNote } = useHandoverNotes(profileId)
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('curriculum')

  // Material form dialog
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<CurriculumMaterial | null>(null)

  // Phase form dialog
  const [showPhaseForm, setShowPhaseForm] = useState(false)
  const [editingPhase, setEditingPhase] = useState<CurriculumPhase | null>(null)
  const [phaseTargetMaterialId, setPhaseTargetMaterialId] = useState<string>('')

  // Exam form dialog
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null)

  // Lesson log form dialog
  const [showLogForm, setShowLogForm] = useState(false)

  // Test score form dialog
  const [showScoreForm, setShowScoreForm] = useState(false)
  const [editingScore, setEditingScore] = useState<TestScore | null>(null)

  // Goal / Skill / Handover forms
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [showHandoverForm, setShowHandoverForm] = useState(false)

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailText, setDetailText] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)

  useEffect(() => {
    if (!profileId) return
    let mounted = true
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', profileId)
          .single()
        if (err) throw err
        if (mounted) setProfile(data)
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [profileId, supabase])

  const handleUpdateProfile = async (id: string, updates: Partial<StudentProfile>) => {
    await updateProfile(id, updates)
    const { data } = await supabase.from('student_profiles').select('*').eq('id', id).single()
    if (data) setProfile(data)
  }

  const handleOpenDetail = () => {
    setDetailText(profile?.personality_notes || '')
    setShowDetailDialog(true)
  }

  const handleSaveDetail = async () => {
    if (!profile) return
    setSavingDetail(true)
    try {
      await handleUpdateProfile(profile.id, { personality_notes: detailText || undefined })
      setShowDetailDialog(false)
    } finally {
      setSavingDetail(false)
    }
  }

  // Material handlers
  const handleAddMaterial = () => { setEditingMaterial(null); setShowMaterialForm(true) }
  const handleEditMaterial = (m: CurriculumMaterial) => { setEditingMaterial(m); setShowMaterialForm(true) }
  const handleSubmitMaterial = async (data: { material_name: string; subject: string; study_pace?: string; color?: string; notes?: string }) => {
    if (editingMaterial) {
      await updateMaterial(editingMaterial.id, data)
    } else {
      await addMaterial({ ...data, order_index: materials.length })
    }
    setShowMaterialForm(false)
  }

  // Phase handlers
  const handleAddPhase = (materialId: string) => { setPhaseTargetMaterialId(materialId); setEditingPhase(null); setShowPhaseForm(true) }
  const handleEditPhase = (p: CurriculumPhase) => { setPhaseTargetMaterialId(p.material_id); setEditingPhase(p); setShowPhaseForm(true) }
  const handleSubmitPhase = async (data: { phase_name: string; total_hours?: number; start_date?: string; end_date?: string }) => {
    if (editingPhase) {
      await updatePhase(editingPhase.id, data)
    } else {
      const materialPhases = phases.filter(p => p.material_id === phaseTargetMaterialId)
      await addPhase({ ...data, material_id: phaseTargetMaterialId, is_date_manual: false, status: 'not_started', order_index: materialPhases.length })
    }
    setShowPhaseForm(false)
  }

  // Exam handlers
  const handleAddExam = () => { setEditingExam(null); setShowExamForm(true) }
  const handleEditExam = (e: ExamSchedule) => { setEditingExam(e); setShowExamForm(true) }
  const handleSubmitExam = async (data: { exam_name: string; exam_category: string; method?: string; exam_date: string; notes?: string }) => {
    if (editingExam) {
      await updateExam(editingExam.id, data)
    } else {
      await addExam(data)
    }
    setShowExamForm(false)
  }

  // Lesson log handler
  const handleSubmitLog = async (data: { lesson_date: string; subject: string; notes?: string }, phaseIds: string[]) => {
    await addLog(data, phaseIds)
    setShowLogForm(false)
  }

  // Test score handlers
  const handleAddScore = () => { setEditingScore(null); setShowScoreForm(true) }
  const handleEditScore = (s: TestScore) => { setEditingScore(s); setShowScoreForm(true) }
  const handleSubmitScore = async (data: { test_name: string; test_type: string; subject: string; score: number; max_score: number; percentile?: number; test_date: string; notes?: string }) => {
    const scoreData = { ...data, test_type: data.test_type as TestType }
    if (editingScore) {
      await updateScore(editingScore.id, scoreData)
    } else {
      await addScore(scoreData)
    }
    setShowScoreForm(false)
  }

  const anyError = error || curriculumError || materialsError || examsError || logsError || scoresError || notesError

  // Current student index for color
  const studentIndex = profiles.findIndex(p => p.id === profileId)

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="px-7 py-6 space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-foreground">{tPage('breadcrumb')}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">年間カリキュラムの進捗をガントチャートで管理</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground border border-border rounded-lg px-3.5 py-2 hover:bg-muted/50 transition-colors bg-card">
              <Download className="w-4 h-4" />
              エクスポート
            </button>
            <Link href="/teacher/curriculum">
              <button className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg px-3.5 py-2 transition-colors">
                <Plus className="w-4 h-4" />
                生徒を追加
              </button>
            </Link>
          </div>
        </div>

        {/* Student Tabs */}
        {profiles.length > 0 && (
          <div className="flex items-center border-b border-border">
            {profiles.map((p, idx) => {
              const isActive = p.id === profileId
              const color = STUDENT_COLORS[idx % STUDENT_COLORS.length]
              return (
                <button
                  key={p.id}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors relative ${
                    isActive
                      ? 'font-bold text-[#7C3AED]'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => router.push(`/teacher/curriculum/${p.id}`)}
                >
                  <div
                    className="w-6 h-6 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{p.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED]" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {(loading || authLoading) ? (
          <SkeletonList count={3} />
        ) : !profile ? (
          <ErrorAlert message={tPage('notFound')} />
        ) : (<>
        {/* Student Info Bar */}
        <StudentInfoBar
          profile={profile}
          materials={materials}
          phases={phases}
          exams={exams}
          colorIndex={studentIndex >= 0 ? studentIndex : 0}
        />

        {anyError && <ErrorAlert message={anyError} />}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="curriculum">{tPage('tabCurriculum')}</TabsTrigger>
            <TabsTrigger value="lessons">{tPage('tabLessonLogs')}</TabsTrigger>
            <TabsTrigger value="scores">{tPage('tabScores')}</TabsTrigger>
            <TabsTrigger value="goals">{tPage('tabGoals')}</TabsTrigger>
            <TabsTrigger value="skills">{tPage('tabSkills')}</TabsTrigger>
            <TabsTrigger value="handover">{tPage('tabHandover')}</TabsTrigger>
          </TabsList>

          {/* Curriculum (Gantt) tab */}
          <TabsContent value="curriculum">
            <div className="space-y-5">
              <GanttChart
                materials={materials}
                phases={phases}
                exams={exams}
                curriculumYear={profile.curriculum_year}
                onAddMaterial={handleAddMaterial}
                onEditMaterial={handleEditMaterial}
                onDeleteMaterial={deleteMaterial}
                onAddPhase={handleAddPhase}
                onEditPhase={handleEditPhase}
                onDeletePhase={deletePhase}
                onUpdatePhase={updatePhase}
                onAddExam={handleAddExam}
                t={(key: string) => tGantt(key)}
              />
              <ExamScheduleList
                exams={exams}
                onAdd={handleAddExam}
                onEdit={handleEditExam}
                onDelete={deleteExam}
                t={(key: string) => tExams(key)}
              />
            </div>
          </TabsContent>

          {/* Lesson Logs tab */}
          <TabsContent value="lessons">
            <LessonLogList
              logs={logs}
              logPhases={logPhases}
              phases={phases}
              onAdd={() => setShowLogForm(true)}
              onDelete={deleteLog}
              t={(key: string) => tLessonLogs(key)}
            />
          </TabsContent>

          {/* Test Scores tab */}
          <TabsContent value="scores">
            <div className="space-y-6">
              <TestScoreChart scores={scores} t={(key: string) => tTestScores(key)} />
              <TestScoreList
                scores={scores}
                onAdd={handleAddScore}
                onEdit={handleEditScore}
                onDelete={deleteScore}
                t={(key: string) => tTestScores(key)}
              />
            </div>
          </TabsContent>

          {/* Goals tab */}
          <TabsContent value="goals">
            {curriculumLoading ? (
              <div className="text-muted-foreground text-sm">{tPage('loading')}</div>
            ) : (
              <GoalList goals={goals} onAdd={() => setShowGoalForm(true)} onUpdate={updateGoal} onDelete={deleteGoal} />
            )}
          </TabsContent>

          {/* Skills tab */}
          <TabsContent value="skills">
            {curriculumLoading ? (
              <div className="text-muted-foreground text-sm">{tPage('loading')}</div>
            ) : (
              <SkillList skills={skills} onAdd={() => setShowSkillForm(true)} onUpdate={updateSkill} onDelete={deleteSkill} />
            )}
          </TabsContent>

          {/* Handover tab */}
          <TabsContent value="handover">
            {notesLoading ? (
              <div className="text-muted-foreground text-sm">{tPage('loading')}</div>
            ) : (
              <HandoverNoteList notes={notes} onAdd={() => setShowHandoverForm(true)} onDelete={deleteNote} />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <MaterialForm
          open={showMaterialForm}
          onOpenChange={setShowMaterialForm}
          onSubmit={handleSubmitMaterial}
          initialData={editingMaterial ? { material_name: editingMaterial.material_name, subject: editingMaterial.subject, study_pace: editingMaterial.study_pace || undefined, color: editingMaterial.color || undefined, notes: editingMaterial.notes || undefined } : undefined}
          t={(key: string) => tMaterials(key)}
        />
        <PhaseForm
          open={showPhaseForm}
          onOpenChange={setShowPhaseForm}
          onSubmit={handleSubmitPhase}
          initialData={editingPhase ? { phase_name: editingPhase.phase_name, total_hours: editingPhase.total_hours || undefined, start_date: editingPhase.start_date || undefined, end_date: editingPhase.end_date || undefined } : undefined}
          t={(key: string) => tPhases(key)}
        />
        <ExamScheduleForm
          open={showExamForm}
          onOpenChange={setShowExamForm}
          onSubmit={handleSubmitExam}
          initialData={editingExam ? { exam_name: editingExam.exam_name, exam_category: editingExam.exam_category, method: editingExam.method || undefined, exam_date: editingExam.exam_date, notes: editingExam.notes || undefined } : undefined}
          t={(key: string) => tExams(key)}
        />
        <LessonLogForm
          open={showLogForm}
          onOpenChange={setShowLogForm}
          onSubmit={handleSubmitLog}
          phases={phases.map(p => {
            const mat = materials.find(m => m.id === p.material_id)
            return { id: p.id, phase_name: p.phase_name, material_name: mat?.material_name || '', subject: mat?.subject || '' }
          })}
          t={(key: string) => tLessonLogs(key)}
        />
        <TestScoreForm
          open={showScoreForm}
          onOpenChange={setShowScoreForm}
          onSubmit={handleSubmitScore}
          initialData={editingScore ? { test_name: editingScore.test_name, test_type: editingScore.test_type, subject: editingScore.subject, score: editingScore.score, max_score: editingScore.max_score, percentile: editingScore.percentile || undefined, test_date: editingScore.test_date, notes: editingScore.notes || undefined } : undefined}
          t={(key: string) => tTestScores(key)}
        />
        <GoalForm open={showGoalForm} onClose={() => setShowGoalForm(false)} onSubmit={addGoal} />
        <SkillForm open={showSkillForm} onClose={() => setShowSkillForm(false)} onSubmit={addSkill} />
        <HandoverNoteForm open={showHandoverForm} onClose={() => setShowHandoverForm(false)} onSubmit={addNote} />

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={v => !v && setShowDetailDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tProfile('detailDialogTitle')}</DialogTitle>
              <DialogDescription>{tProfile('detailDialogDescription')}</DialogDescription>
            </DialogHeader>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
              value={detailText}
              onChange={e => setDetailText(e.target.value)}
              placeholder={tProfile('personalityPlaceholder')}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)} disabled={savingDetail}>{tc('cancel')}</Button>
              <LoadingButton onClick={handleSaveDetail} loading={savingDetail}>
                {tc('save')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>)}
      </div>
    </ProtectedRoute>
  )
}
