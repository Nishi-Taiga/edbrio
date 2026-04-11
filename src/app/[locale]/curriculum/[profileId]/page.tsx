"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  ChevronDown,
  ChevronLeft,
  FileSpreadsheet,
  FileText,
  Share2,
  Undo2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAuth } from "@/hooks/use-auth";
import { useStudentProfiles } from "@/hooks/use-student-profiles";
import { useCurriculumMaterials } from "@/hooks/use-curriculum-materials";
import { useExamSchedules } from "@/hooks/use-exam-schedules";
import { useTestScores } from "@/hooks/use-test-scores";
import { createClient } from "@/lib/supabase/client";
import {
  StudentProfile,
  CurriculumMaterial,
  CurriculumPhase,
  ExamSchedule,
  TestScore,
  TestType,
} from "@/lib/types/database";
import { StudentInfoBar } from "@/components/curriculum/student-info-bar";
import { GanttChart } from "@/components/curriculum/gantt-chart";
import { MaterialForm } from "@/components/curriculum/material-form";
import { PhaseForm } from "@/components/curriculum/phase-form";
import { PhaseDetailDialog } from "@/components/curriculum/phase-detail-dialog";

import { ExamScheduleList } from "@/components/curriculum/exam-schedule-list";
import { ExamScheduleForm } from "@/components/curriculum/exam-schedule-form";
import { TestScoreList } from "@/components/curriculum/test-score-list";
import { TestScoreForm } from "@/components/curriculum/test-score-form";
import { TestScoreChart } from "@/components/curriculum/test-score-chart";
import {
  exportCurriculumPDF,
  exportCurriculumExcel,
} from "@/lib/export-curriculum";
import { useTranslations } from "next-intl";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { ShareLinkDialog } from "@/components/curriculum/share-link-dialog";

export default function StudentCurriculumPage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const tPage = useTranslations("curriculum.page");
  const tProfile = useTranslations("curriculum.profile");
  const tGantt = useTranslations("curriculum.gantt");
  const tMaterials = useTranslations("curriculum.materials");
  const tPhases = useTranslations("curriculum.phases");
  const tExams = useTranslations("curriculum.exams");
  const tTestScores = useTranslations("curriculum.testScores");
  const tc = useTranslations("common");
  const { user, loading: authLoading } = useAuth();
  const { profiles } = useStudentProfiles(user?.id);
  const { updateProfile } = useStudentProfiles(user?.id);

  // Year selection (persist in localStorage per profile)
  const yearStorageKey = `curriculum_year_${profileId}`;
  const [selectedYear, setSelectedYear] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(yearStorageKey);
      if (saved) return saved;
    }
    // Default to current academic year (April-March)
    const now = new Date();
    return String(
      now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear(),
    );
  });

  // Persist year selection to localStorage
  useEffect(() => {
    if (selectedYear) {
      localStorage.setItem(yearStorageKey, selectedYear);
    }
  }, [selectedYear, yearStorageKey]);

  const {
    materials,
    phases,
    phaseTasks,
    error: materialsError,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addPhase,
    updatePhase,
    deletePhase,
    addTask,
    updateTask,
    deleteTask,
    reorderMaterials,
    refresh: refreshCurriculum,
  } = useCurriculumMaterials(profileId, selectedYear);

  // Ctrl+Z to undo (refresh data from DB)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        refreshCurriculum();
        toast.success("データを再読み込みしました");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [refreshCurriculum]);

  const {
    exams,
    error: examsError,
    addExam,
    updateExam,
    deleteExam,
  } = useExamSchedules(profileId);
  const {
    scores,
    error: scoresError,
    addScore,
    updateScore,
    deleteScore,
  } = useTestScores(profileId);
  const supabase = useMemo(() => createClient(), []);
  const ganttRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("curriculum");
  const [exporting, setExporting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Material form dialog
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<CurriculumMaterial | null>(null);

  // Phase form dialog
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<CurriculumPhase | null>(
    null,
  );
  const [phaseTargetMaterialId, setPhaseTargetMaterialId] =
    useState<string>("");

  // Phase detail dialog
  const [showPhaseDetail, setShowPhaseDetail] = useState(false);
  const [detailPhase, setDetailPhase] = useState<CurriculumPhase | null>(null);
  const [detailMaterialName, setDetailMaterialName] = useState("");

  // Exam form dialog
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null);

  // Test score form dialog
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [editingScore, setEditingScore] = useState<TestScore | null>(null);

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailText, setDetailText] = useState("");
  const [savingDetail, setSavingDetail] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let mounted = true;
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("id", profileId)
          .single();
        if (err) throw err;
        if (mounted) {
          setProfile(data);
          if (data.curriculum_year && !selectedYear) {
            setSelectedYear(data.curriculum_year);
          }
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : e && typeof e === "object" && "message" in e
              ? String((e as { message: string }).message)
              : String(e);
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, supabase]);

  const handleUpdateProfile = async (
    id: string,
    updates: Partial<StudentProfile>,
  ) => {
    await updateProfile(id, updates);
    const { data } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (data) setProfile(data);
  };

  const handleSaveDetail = async () => {
    if (!profile) return;
    setSavingDetail(true);
    try {
      await handleUpdateProfile(profile.id, {
        personality_notes: detailText || undefined,
      });
      setShowDetailDialog(false);
    } finally {
      setSavingDetail(false);
    }
  };

  // Subject form dialog
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  const handleAddSubject = () => {
    setNewSubjectName("");
    setShowSubjectForm(true);
  };
  const handleSubmitSubject = async () => {
    if (!newSubjectName.trim()) return;
    setSavingSubject(true);
    try {
      await addMaterial({
        material_name: newSubjectName.trim(),
        subject: newSubjectName.trim(),
        order_index: materials.length,
        curriculum_year: selectedYear,
      });
      setShowSubjectForm(false);
    } catch {
      toast.error("科目の追加に失敗しました");
    } finally {
      setSavingSubject(false);
    }
  };

  // Material handlers
  const [prefilledSubject, setPrefilledSubject] = useState<string | null>(null);
  const handleAddMaterialToSubject = (subject: string) => {
    setEditingMaterial(null);
    setPrefilledSubject(subject);
    setShowMaterialForm(true);
  };
  const handleEditMaterial = (m: CurriculumMaterial) => {
    setEditingMaterial(m);
    setPrefilledSubject(null);
    setShowMaterialForm(true);
  };
  const handleSubmitMaterial = async (data: {
    material_name: string;
    subject: string;
    notes?: string;
  }) => {
    if (editingMaterial) {
      await updateMaterial(editingMaterial.id, data);
    } else {
      await addMaterial({
        ...data,
        order_index: materials.length,
        curriculum_year: selectedYear,
      });
    }
    setShowMaterialForm(false);
    setPrefilledSubject(null);
  };

  // Phase handlers (optional dates from Gantt timeline click/drag)
  const [prefilledPhaseDates, setPrefilledPhaseDates] = useState<{
    start_date: string;
    end_date: string;
  } | null>(null);
  const handleAddPhase = (
    materialId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    setPhaseTargetMaterialId(materialId);
    setEditingPhase(null);
    setPrefilledPhaseDates(
      startDate && endDate
        ? { start_date: startDate, end_date: endDate }
        : null,
    );
    setShowPhaseForm(true);
  };
  const handleEditPhase = (p: CurriculumPhase) => {
    setPhaseTargetMaterialId(p.material_id);
    setEditingPhase(p);
    setShowPhaseForm(true);
  };
  const handleSubmitPhase = async (data: {
    phase_name: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (editingPhase) {
      await updatePhase(editingPhase.id, data);
    } else {
      const materialPhases = phases.filter(
        (p) => p.material_id === phaseTargetMaterialId,
      );
      await addPhase({
        ...data,
        material_id: phaseTargetMaterialId,
        is_date_manual: false,
        status: "not_started",
        order_index: materialPhases.length,
      });
    }
    setShowPhaseForm(false);
  };

  // Phase detail (click on Gantt bar)
  const handlePhaseClick = (phase: CurriculumPhase, materialName: string) => {
    setDetailPhase(phase);
    setDetailMaterialName(materialName);
    setShowPhaseDetail(true);
  };

  // Exam handlers
  const [prefilledExamDate, setPrefilledExamDate] = useState<string | null>(
    null,
  );
  const lastDialogCloseRef = useRef(0);
  const handleAddExam = (date?: string) => {
    // Ignore clicks within 300ms of a dialog closing (prevents ghost clicks)
    if (Date.now() - lastDialogCloseRef.current < 300) return;
    setEditingExam(null);
    setPrefilledExamDate(date || null);
    setShowExamForm(true);
  };
  const handleEditExam = (e: ExamSchedule) => {
    setEditingExam(e);
    setShowExamForm(true);
  };
  const handleSubmitExam = async (data: {
    exam_name: string;
    exam_category: string;
    method?: string;
    exam_date: string;
    preference_order?: number;
    border_score?: number;
    border_score_type?: "deviation" | "percentage";
    notes?: string;
  }) => {
    if (editingExam) {
      await updateExam(editingExam.id, data);
    } else {
      await addExam(data);
    }
    setShowExamForm(false);
  };

  // Test score handlers
  const handleAddScore = () => {
    setEditingScore(null);
    setShowScoreForm(true);
  };
  const handleEditScore = (s: TestScore) => {
    setEditingScore(s);
    setShowScoreForm(true);
  };
  const handleSubmitScore = async (data: {
    test_name: string;
    test_type: string;
    subject: string;
    score: number;
    max_score: number;
    percentile?: number;
    test_date: string;
    notes?: string;
  }) => {
    const scoreData = { ...data, test_type: data.test_type as TestType };
    if (editingScore) {
      await updateScore(editingScore.id, scoreData);
    } else {
      await addScore(scoreData);
    }
    setShowScoreForm(false);
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (!ganttRef.current || !profile) return;
    setExporting(true);
    try {
      const result = await exportCurriculumPDF(ganttRef.current, profile.name);
      if (!result.success) toast.error(result.error || "PDF出力に失敗しました");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!profile) return;
    setExporting(true);
    try {
      const result = await exportCurriculumExcel({
        studentName: profile.name,
        materials,
        phases,
        exams,
        phaseTasks,
      });
      if (!result.success)
        toast.error(result.error || "Excel出力に失敗しました");
    } finally {
      setExporting(false);
    }
  };

  const existingSubjects = useMemo(() => {
    const set = new Set(materials.map((m) => m.subject));
    return Array.from(set);
  }, [materials]);

  // Year selection - default to current academic year (April-March)
  const now = new Date();
  const currentYear =
    now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();

  const anyError = error || materialsError || examsError || scoresError;

  // Current student index for color
  const studentIndex = profiles.findIndex((p) => p.id === profileId);

  // Material name for phase form
  const phaseTargetMaterialName =
    materials.find((m) => m.id === phaseTargetMaterialId)?.material_name || "";

  return (
    <>
      <div className="px-4 sm:px-7 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-[22px] font-extrabold text-foreground">
              {tPage("breadcrumb")}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">
              年間カリキュラムの進捗をガントチャートで管理
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors bg-card"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">共有</span>
            </button>
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

            <Link href="/curriculum/dashboard">
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors bg-card">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">生徒一覧</span>
              </button>
            </Link>
          </div>
        </div>

        {loading || authLoading ? (
          <SkeletonList count={3} />
        ) : !profile ? (
          <ErrorAlert message={tPage("notFound")} />
        ) : (
          <>
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

            {/* Year selector + Content Tabs (inline) */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center gap-3 mb-4">
                <Select
                  value={selectedYear || String(currentYear)}
                  onValueChange={setSelectedYear}
                >
                  <SelectTrigger
                    className="w-[130px] h-9 text-sm font-semibold"
                    aria-label="年度を選択"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: 5 },
                      (_, i) => currentYear - 2 + i,
                    ).map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}年度
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TabsList className="flex-wrap">
                  <TabsTrigger value="curriculum">
                    {tPage("tabCurriculum")}
                  </TabsTrigger>
                  <TabsTrigger value="scores">{tPage("tabScores")}</TabsTrigger>
                </TabsList>
                <button
                  className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors ml-auto"
                  onClick={() => refreshCurriculum()}
                  title="元に戻す (Ctrl+Z)"
                  aria-label="元に戻す"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">元に戻す</span>
                </button>
              </div>

              {/* Curriculum (Gantt) tab */}
              <TabsContent value="curriculum">
                <div className="space-y-5">
                  <div ref={ganttRef}>
                    <GanttChart
                      materials={materials}
                      phases={phases}
                      phaseTasks={phaseTasks}
                      exams={exams}
                      curriculumYear={selectedYear || profile.curriculum_year}
                      onAddSubject={handleAddSubject}
                      onDeleteSubject={async (_subject, materialIds) => {
                        for (const id of materialIds) await deleteMaterial(id);
                      }}
                      onAddMaterialToSubject={handleAddMaterialToSubject}
                      onEditMaterial={handleEditMaterial}
                      onDeleteMaterial={deleteMaterial}
                      onAddPhase={handleAddPhase}
                      onEditPhase={handleEditPhase}
                      onDeletePhase={deletePhase}
                      onUpdatePhase={updatePhase}
                      onReorderMaterials={reorderMaterials}
                      onAddExam={handleAddExam}
                      onPhaseClick={handlePhaseClick}
                      t={(key: string) => tGantt(key)}
                    />
                  </div>
                  <ExamScheduleList
                    exams={exams}
                    academicYear={Number(selectedYear || currentYear)}
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
                  <TestScoreChart
                    scores={scores}
                    exams={exams}
                    t={(key: string) => tTestScores(key)}
                  />
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
              onOpenChange={(v) => {
                setShowMaterialForm(v);
                if (!v) lastDialogCloseRef.current = Date.now();
              }}
              onSubmit={handleSubmitMaterial}
              initialData={
                editingMaterial
                  ? {
                      material_name: editingMaterial.material_name,
                      subject: editingMaterial.subject,
                      notes: editingMaterial.notes || undefined,
                    }
                  : prefilledSubject
                    ? { material_name: "", subject: prefilledSubject }
                    : undefined
              }
              existingSubjects={existingSubjects}
              t={(key: string) => tMaterials(key)}
            />
            <PhaseForm
              open={showPhaseForm}
              onOpenChange={(v) => {
                setShowPhaseForm(v);
                if (!v) lastDialogCloseRef.current = Date.now();
              }}
              onSubmit={handleSubmitPhase}
              initialData={
                editingPhase
                  ? {
                      phase_name: editingPhase.phase_name,
                      start_date: editingPhase.start_date || undefined,
                      end_date: editingPhase.end_date || undefined,
                    }
                  : prefilledPhaseDates
                    ? { phase_name: "", ...prefilledPhaseDates }
                    : undefined
              }
              materialName={phaseTargetMaterialName}
              curriculumYear={selectedYear}
              t={(key: string) => tPhases(key)}
            />
            <PhaseDetailDialog
              open={showPhaseDetail}
              onOpenChange={(v) => {
                setShowPhaseDetail(v);
                if (!v) lastDialogCloseRef.current = Date.now();
              }}
              phase={detailPhase}
              materialName={detailMaterialName}
              tasks={phaseTasks.filter((t) => t.phase_id === detailPhase?.id)}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onUpdatePhase={updatePhase}
            />
            <ExamScheduleForm
              open={showExamForm}
              onOpenChange={setShowExamForm}
              onSubmit={handleSubmitExam}
              initialData={
                editingExam
                  ? {
                      exam_name: editingExam.exam_name,
                      exam_category: editingExam.exam_category,
                      method: editingExam.method || undefined,
                      exam_date: editingExam.exam_date,
                      preference_order:
                        editingExam.preference_order || undefined,
                      border_score: editingExam.border_score || undefined,
                      border_score_type:
                        editingExam.border_score_type || undefined,
                      notes: editingExam.notes || undefined,
                    }
                  : prefilledExamDate
                    ? {
                        exam_name: "",
                        exam_category: "school_exam",
                        exam_date: prefilledExamDate,
                      }
                    : undefined
              }
              t={(key: string) => tExams(key)}
            />
            <TestScoreForm
              open={showScoreForm}
              onOpenChange={setShowScoreForm}
              onSubmit={handleSubmitScore}
              initialData={
                editingScore
                  ? {
                      test_name: editingScore.test_name,
                      test_type: editingScore.test_type,
                      subject: editingScore.subject,
                      score: editingScore.score,
                      max_score: editingScore.max_score,
                      percentile: editingScore.percentile || undefined,
                      test_date: editingScore.test_date,
                      notes: editingScore.notes || undefined,
                    }
                  : undefined
              }
              t={(key: string) => tTestScores(key)}
            />
            {/* Subject Add Dialog */}
            <Dialog
              open={showSubjectForm}
              onOpenChange={(v) => !v && setShowSubjectForm(false)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tGantt("addSubject")}</DialogTitle>
                  <DialogDescription>
                    追加する科目名を入力してください
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Label htmlFor="subject-name">科目名</Label>
                  <Input
                    id="subject-name"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="例: 数学"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitSubject();
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowSubjectForm(false)}
                    disabled={savingSubject}
                  >
                    {tc("cancel")}
                  </Button>
                  <LoadingButton
                    onClick={handleSubmitSubject}
                    loading={savingSubject}
                    disabled={!newSubjectName.trim()}
                  >
                    {tc("add")}
                  </LoadingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Detail Dialog */}
            <Dialog
              open={showDetailDialog}
              onOpenChange={(v) => !v && setShowDetailDialog(false)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tProfile("detailDialogTitle")}</DialogTitle>
                  <DialogDescription>
                    {tProfile("detailDialogDescription")}
                  </DialogDescription>
                </DialogHeader>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
                  value={detailText}
                  onChange={(e) => setDetailText(e.target.value)}
                  placeholder={tProfile("personalityPlaceholder")}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailDialog(false)}
                    disabled={savingDetail}
                  >
                    {tc("cancel")}
                  </Button>
                  <LoadingButton
                    onClick={handleSaveDetail}
                    loading={savingDetail}
                  >
                    {tc("save")}
                  </LoadingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Share Link Dialog */}
        {profile && (
          <ShareLinkDialog
            open={showShare}
            onOpenChange={setShowShare}
            profileId={profileId}
            studentName={profile.name}
          />
        )}
      </div>
    </>
  );
}
