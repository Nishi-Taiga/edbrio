"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { EdBrioLogo } from "@/components/ui/edbrio-logo";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentInfoBar } from "@/components/curriculum/student-info-bar";
import { GanttChart } from "@/components/curriculum/gantt-chart";
import { ExamScheduleList } from "@/components/curriculum/exam-schedule-list";
import { TestScoreChart } from "@/components/curriculum/test-score-chart";
import { TestScoreList } from "@/components/curriculum/test-score-list";
import { useTranslations } from "next-intl";
import type {
  StudentProfile,
  CurriculumMaterial,
  CurriculumPhase,
  PhaseTask,
  ExamSchedule,
  TestScore,
} from "@/lib/types/database";

interface SharedData {
  profile: StudentProfile;
  materials: CurriculumMaterial[];
  phases: CurriculumPhase[];
  phaseTasks: PhaseTask[];
  exams: ExamSchedule[];
  scores: TestScore[];
}

export default function SharedCurriculumPage() {
  const params = useParams();
  const token = params.token as string;
  const tPage = useTranslations("curriculum.page");
  const tGantt = useTranslations("curriculum.gantt");
  const tExams = useTranslations("curriculum.exams");
  const tTestScores = useTranslations("curriculum.testScores");

  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("curriculum");

  // Year selection
  const now = new Date();
  const currentYear =
    now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const res = await fetch(`/api/curriculum/share/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "データの取得に失敗しました");
          return;
        }
        setData(json);
        if (json.profile?.curriculum_year) {
          setSelectedYear(json.profile.curriculum_year);
        }
      } catch {
        setError("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Filter materials by selected year
  const filteredMaterials = useMemo(
    () =>
      data?.materials.filter(
        (m) => !m.curriculum_year || m.curriculum_year === selectedYear,
      ) ?? [],
    [data?.materials, selectedYear],
  );

  const filteredPhases = useMemo(() => {
    const matIds = new Set(filteredMaterials.map((m) => m.id));
    return data?.phases.filter((p) => matIds.has(p.material_id)) ?? [];
  }, [data?.phases, filteredMaterials]);

  const filteredTasks = useMemo(() => {
    const phaseIds = new Set(filteredPhases.map((p) => p.id));
    return data?.phaseTasks.filter((t) => phaseIds.has(t.phase_id)) ?? [];
  }, [data?.phaseTasks, filteredPhases]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <SharedHeader />
        <div className="container mx-auto px-4 py-8">
          <SkeletonList count={5} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface">
        <SharedHeader />
        <div className="container mx-auto px-4 py-8">
          <ErrorAlert message={error || "データが見つかりません"} />
        </div>
      </div>
    );
  }

  const { profile, exams, scores } = data;

  // No-op handlers for read-only gantt
  const noop = () => {};
  const noopAsync = async () => {};

  return (
    <div className="min-h-screen bg-surface">
      <SharedHeader />
      <div className="px-4 sm:px-7 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Student Info */}
        <StudentInfoBar profile={profile} exams={exams} />

        {/* Year + Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-3 mb-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger
                className="w-[130px] h-9 text-sm font-semibold"
                aria-label="年度を選択"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
                  (y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}年度
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <TabsList>
              <TabsTrigger value="curriculum">
                {tPage("tabCurriculum")}
              </TabsTrigger>
              <TabsTrigger value="scores">{tPage("tabScores")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="curriculum">
            <div className="space-y-5">
              <GanttChart
                materials={filteredMaterials}
                phases={filteredPhases}
                phaseTasks={filteredTasks}
                exams={exams}
                curriculumYear={selectedYear}
                onAddSubject={noop}
                onAddMaterialToSubject={noop}
                onEditMaterial={noop}
                onDeleteMaterial={noop}
                onAddPhase={noop}
                onEditPhase={noop}
                onDeletePhase={noop}
                onUpdatePhase={noopAsync}
                onAddExam={noop}
                readOnly
                t={(key: string) => tGantt(key)}
              />
              <ExamScheduleList
                exams={exams}
                academicYear={Number(selectedYear)}
                onAdd={noop}
                onEdit={noop}
                onDelete={noopAsync}
                readOnly
                t={(key: string) => tExams(key)}
              />
            </div>
          </TabsContent>

          <TabsContent value="scores">
            <div className="space-y-6">
              <TestScoreChart
                scores={scores}
                exams={exams}
                t={(key: string) => tTestScores(key)}
              />
              <TestScoreList
                scores={scores}
                onAdd={noop}
                onEdit={noop}
                onDelete={noopAsync}
                readOnly
                t={(key: string) => tTestScores(key)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SharedHeader() {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-2.5">
        <EdBrioLogo size={28} />
        <span className="text-lg font-bold text-foreground">
          カリキュラム管理
        </span>
      </div>
    </header>
  );
}
