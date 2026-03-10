"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FileEdit, Download, Plus, ChevronDown, Copy, FileSpreadsheet, FileText } from 'lucide-react'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useCurriculumMaterials } from '@/hooks/use-curriculum-materials'
import { useExamSchedules } from '@/hooks/use-exam-schedules'
import { useTestScores } from '@/hooks/use-test-scores'
import { createClient } from '@/lib/supabase/client'
import { StudentProfile, CurriculumMaterial, CurriculumPhase, ExamSchedule, TestScore, TestType } from '@/lib/types/database'
import { StudentInfoBar } from '@/components/curriculum/student-info-bar'
import { GanttChart } from '@/components/curriculum/gantt-chart'
import { MaterialForm } from '@/components/curriculum/material-form'
import { PhaseForm } from '@/components/curriculum/phase-form'
import { PhaseDetailDialog } from '@/components/curriculum/phase-detail-dialog'
import { SubjectColorEditor } from '@/components/curriculum/subject-color-editor'
import { ExamScheduleList } from '@/components/curriculum/exam-schedule-list'
import { ExamScheduleForm } from '@/components/curriculum/exam-schedule-form'
import { TestScoreList } from '@/components/curriculum/test-score-list'
import { TestScoreForm } from '@/components/curriculum/test-score-form'
import { TestScoreChart } from '@/components/curriculum/test-score-chart'
import { exportCurriculumPDF, exportCurriculumExcel } from '@/lib/export-curriculum'
import { useTranslations } from 'next-intl'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'sonner'

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
  const tTestScores = useTranslations('curriculum.testScores')
  const tc = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const { profiles } = useStudentProfiles(user?.id)
  const { updateProfile } = useStudentProfiles(user?.id)

  // Year selection
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined)

  const { materials, phases, phaseTasks, loading: materialsLoading, error: materialsError, addMaterial, updateMaterial, deleteMaterial, addPhase, updatePhase, deletePhase, addTask, updateTask, deleteTask, copyToNextYear } = useCurriculumMaterials(profileId, selectedYear)
  const { exams, loading: examsLoading, error: examsError, addExam, updateExam, deleteExam } = useExamSchedules(profileId)
  const { scores, loading: scoresLoading, error: scoresError, addScore, updateScore, deleteScore } = useTestScores(profileId)
  const supabase = useMemo(() => createClient(), [])
  const ganttRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('curriculum')
  const [exporting, setExporting] = useState(false)

  // Material form dialog
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<CurriculumMaterial | null>(null)

  // Phase form dialog
  const [showPhaseForm, setShowPhaseForm] = useState(false)
  const [editingPhase, setEditingPhase] = useState<CurriculumPhase | null>(null)
  const [phaseTargetMaterialId, setPhaseTargetMaterialId] = useState<string>('')

  // Phase detail dialog
  const [showPhaseDetail, setShowPhaseDetail] = useState(false)
  const [detailPhase, setDetailPhase] = useState<CurriculumPhase | null>(null)
  const [detailMaterialName, setDetailMaterialName] = useState('')

  // Exam form dialog
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null)

  // Test score form dialog
  const [showScoreForm, setShowScoreForm] = useState(false)
  const [editingScore, setEditingScore] = useState<TestScore | null>(null)

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailText, setDetailText] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)

  // Copy year dialog
  const [showCopyYearDialog, setShowCopyYearDialog] = useState(false)
  const [copyingYear, setCopyingYear] = useState(false)

  // Subject color editor
  const [showColorEditor, setShowColorEditor] = useState(false)

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
        if (mounted) {
          setProfile(data)
          if (data.curriculum_year && !selectedYear) {
            setSelectedYear(data.curriculum_year)
          }
        }
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
      await addMaterial({ ...data, order_index: materials.length, curriculum_year: selectedYear })
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

  // Phase detail (click on Gantt bar)
  const handlePhaseClick = (phase: CurriculumPhase, materialName: string) => {
    setDetailPhase(phase)
    setDetailMaterialName(materialName)
    setShowPhaseDetail(true)
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

  // Export handlers
  const handleExportPDF = async () => {
    if (!ganttRef.current || !profile) return
    setExporting(true)
    try {
      const result = await exportCurriculumPDF(ganttRef.current, profile.name)
      if (!result.success) toast.error(result.error || 'PDF出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!profile) return
    setExporting(true)
    try {
      const result = await exportCurriculumExcel({
        studentName: profile.name,
        materials,
        phases,
        exams,
        phaseTasks,
      })
      if (!result.success) toast.error(result.error || 'Excel出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }

  // Subject color handlers
  const subjectColors = profile?.subject_colors || {}
  const existingSubjects = useMemo(() => {
    const set = new Set(materials.map(m => m.subject))
    return Array.from(set)
  }, [materials])

  const handleSubjectColorsChange = async (colors: Record<string, string>) => {
    if (!profile) return
    await handleUpdateProfile(profile.id, { subject_colors: colors } as Partial<StudentProfile>)
  }

  // Year selection
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years = new Set<string>()
    if (profile?.curriculum_year) years.add(profile.curriculum_year)
    years.add(String(currentYear))
    years.add(String(currentYear + 1))
    return Array.from(years).sort()
  }, [profile?.curriculum_year, currentYear])

  const handleCopyToNextYear = async () => {
    if (!selectedYear) return
    setCopyingYear(true)
    try {
      const nextYear = String(Number(selectedYear) + 1)
      await copyToNextYear(nextYear)
      setSelectedYear(nextYear)
      toast.success(`${nextYear}年度のカリキュラムを作成しました`)
      setShowCopyYearDialog(false)
    } catch {
      toast.error('次年度カリキュラムの作成に失敗しました')
    } finally {
      setCopyingYear(false)
    }
  }

  const anyError = error || materialsError || examsError || scoresError

  // Current student index for color
  const studentIndex = profiles.findIndex(p => p.id === profileId)

  // Material name for phase form
  const phaseTargetMaterialName = materials.find(m => m.id === phaseTargetMaterialId)?.material_name || ''

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="px-4 sm:px-7 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-[22px] font-extrabold text-foreground">{tPage('breadcrumb')}</h1>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">年間カリキュラムの進捗をガントチャートで管理</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Year selector */}
            <select
              value={selectedYear || ''}
              onChange={e => setSelectedYear(e.target.value || undefined)}
              className="text-[13px] font-medium text-foreground border border-border rounded-lg px-3 py-2 bg-card"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}年度</option>
              ))}
            </select>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors bg-card"
                  disabled={exporting}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">エクスポート</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Copy to next year */}
            <button
              className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors bg-card"
              onClick={() => setShowCopyYearDialog(true)}
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">次年度作成</span>
            </button>

            <Link href="/teacher/curriculum">
              <button className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg px-3.5 py-2 transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">生徒を追加</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Student Tabs */}
        {profiles.length > 0 && (
          <div className="flex items-center border-b border-border overflow-x-auto scrollbar-hide">
            {profiles.map((p, idx) => {
              const isActive = p.id === profileId
              const color = STUDENT_COLORS[idx % STUDENT_COLORS.length]
              return (
                <button
                  key={p.id}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[12px] sm:text-[13px] transition-colors relative whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'font-bold text-[#7C3AED]'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => router.push(`/teacher/curriculum/${p.id}`)}
                >
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shrink-0"
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
          phaseTasks={phaseTasks}
          colorIndex={studentIndex >= 0 ? studentIndex : 0}
        />

        {anyError && <ErrorAlert message={anyError} />}

        {/* Subject Color Editor (toggle) */}
        {showColorEditor && existingSubjects.length > 0 && (
          <SubjectColorEditor
            subjects={existingSubjects}
            subjectColors={subjectColors}
            onChange={handleSubjectColorsChange}
          />
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="curriculum">{tPage('tabCurriculum')}</TabsTrigger>
            <TabsTrigger value="scores">{tPage('tabScores')}</TabsTrigger>
          </TabsList>

          {/* Curriculum (Gantt) tab */}
          <TabsContent value="curriculum">
            <div className="space-y-5">
              {/* Color editor toggle */}
              <div className="flex justify-end">
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowColorEditor(!showColorEditor)}
                >
                  {showColorEditor ? '色設定を閉じる' : '科目の色を変更'}
                </button>
              </div>
              <div ref={ganttRef}>
                <GanttChart
                  materials={materials}
                  phases={phases}
                  phaseTasks={phaseTasks}
                  exams={exams}
                  curriculumYear={selectedYear || profile.curriculum_year}
                  subjectColors={subjectColors}
                  onAddMaterial={handleAddMaterial}
                  onEditMaterial={handleEditMaterial}
                  onDeleteMaterial={deleteMaterial}
                  onAddPhase={handleAddPhase}
                  onEditPhase={handleEditPhase}
                  onDeletePhase={deletePhase}
                  onUpdatePhase={updatePhase}
                  onAddExam={handleAddExam}
                  onPhaseClick={handlePhaseClick}
                  t={(key: string) => tGantt(key)}
                />
              </div>
              <ExamScheduleList
                exams={exams}
                onAdd={handleAddExam}
                onEdit={handleEditExam}
                onDelete={deleteExam}
                t={(key: string) => tExams(key)}
              />
            </div>
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

        </Tabs>

        {/* Dialogs */}
        <MaterialForm
          open={showMaterialForm}
          onOpenChange={setShowMaterialForm}
          onSubmit={handleSubmitMaterial}
          initialData={editingMaterial ? { material_name: editingMaterial.material_name, subject: editingMaterial.subject, study_pace: editingMaterial.study_pace || undefined, color: editingMaterial.color || undefined, notes: editingMaterial.notes || undefined } : undefined}
          existingSubjects={existingSubjects}
          t={(key: string) => tMaterials(key)}
        />
        <PhaseForm
          open={showPhaseForm}
          onOpenChange={setShowPhaseForm}
          onSubmit={handleSubmitPhase}
          initialData={editingPhase ? { phase_name: editingPhase.phase_name, total_hours: editingPhase.total_hours || undefined, start_date: editingPhase.start_date || undefined, end_date: editingPhase.end_date || undefined } : undefined}
          materialName={phaseTargetMaterialName}
          t={(key: string) => tPhases(key)}
        />
        <PhaseDetailDialog
          open={showPhaseDetail}
          onOpenChange={setShowPhaseDetail}
          phase={detailPhase}
          materialName={detailMaterialName}
          tasks={phaseTasks.filter(t => t.phase_id === detailPhase?.id)}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onUpdatePhase={updatePhase}
        />
        <ExamScheduleForm
          open={showExamForm}
          onOpenChange={setShowExamForm}
          onSubmit={handleSubmitExam}
          initialData={editingExam ? { exam_name: editingExam.exam_name, exam_category: editingExam.exam_category, method: editingExam.method || undefined, exam_date: editingExam.exam_date, notes: editingExam.notes || undefined } : undefined}
          t={(key: string) => tExams(key)}
        />
        <TestScoreForm
          open={showScoreForm}
          onOpenChange={setShowScoreForm}
          onSubmit={handleSubmitScore}
          initialData={editingScore ? { test_name: editingScore.test_name, test_type: editingScore.test_type, subject: editingScore.subject, score: editingScore.score, max_score: editingScore.max_score, percentile: editingScore.percentile || undefined, test_date: editingScore.test_date, notes: editingScore.notes || undefined } : undefined}
          t={(key: string) => tTestScores(key)}
        />
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

        {/* Copy Year Dialog */}
        <Dialog open={showCopyYearDialog} onOpenChange={setShowCopyYearDialog}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>次年度カリキュラムを作成</DialogTitle>
              <DialogDescription>
                {selectedYear}年度のカリキュラムを{Number(selectedYear) + 1}年度にコピーします。日程は1年後にシフトされ、ステータスはリセットされます。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCopyYearDialog(false)} disabled={copyingYear}>{tc('cancel')}</Button>
              <LoadingButton onClick={handleCopyToNextYear} loading={copyingYear}>
                作成する
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>)}
      </div>
    </ProtectedRoute>
  )
}
