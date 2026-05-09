"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorAlert } from "@/components/ui/error-alert";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useStudentProfiles } from "@/hooks/use-student-profiles";
import { LoadingButton } from "@/components/ui/loading-button";
import { StudentCard } from "@/components/curriculum/student-card";
import { PlanGateCurriculum } from "@/components/curriculum/plan-gate-curriculum";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { TeacherPlan, StudentProfile } from "@/lib/types/database";

export default function TeacherStudentsPage() {
  const t = useTranslations("teacherStudents");
  const tc = useTranslations("common");
  const { user, loading: authLoading } = useAuth();
  const { profiles, loading, error, createProfile } = useStudentProfiles(
    user?.id,
  );
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [hideInactive, setHideInactive] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newSubjects, setNewSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const [plan, setPlan] = useState<TeacherPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("teachers")
      .select("plan")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setPlan(data?.plan ?? "free");
        setPlanLoading(false);
      });
  }, [user?.id, supabase]);

  // Unique grades for filter
  const grades = useMemo(() => {
    const set = new Set(
      profiles.map((p) => p.grade).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [profiles]);

  const filtered = profiles.filter((p) => {
    if (hideInactive && p.status !== "active") return false;
    if (gradeFilter !== "all" && p.grade !== gradeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createProfile({
        name: newName.trim(),
        grade: newGrade.trim() || undefined,
        subjects: newSubjects,
        status: "active",
      } as Omit<
        StudentProfile,
        "id" | "teacher_id" | "created_at" | "updated_at"
      >);
      setNewName("");
      setNewGrade("");
      setNewSubjects([]);
      setNewSubjectInput("");
      setShowAdd(false);
      toast.success(t("addSuccess"));
    } catch {
      toast.error(t("addError"));
    } finally {
      setSaving(false);
    }
  };

  if (planLoading || authLoading) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          読み込み中...
        </div>
      </ProtectedRoute>
    );
  }

  if (plan !== "standard") {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <PlanGateCurriculum />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
              {t("description")}
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t("addStudent")}
          </Button>
        </div>

        {error && <ErrorAlert message={error} />}

        {profiles.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <Input
                className="pl-10"
                placeholder="生徒名で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {grades.length > 0 && (
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger
                  className="w-[140px] h-9 text-sm"
                  aria-label="学年で絞り込み"
                >
                  <SelectValue placeholder="学年" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての学年</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
                className="rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
              />
              {t("hideInactive")}
            </label>
          </div>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          profiles.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={{
                label: t("emptyAction"),
                onClick: () => setShowAdd(true),
              }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title={t("noSearchResults")}
              description={t("noSearchResultsDescription")}
            />
          )
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] dark:bg-muted/30 border-b border-border">
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-muted-foreground tracking-wider">
                    生徒名
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[100px]">
                    学年
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-muted-foreground tracking-wider hidden md:table-cell w-[120px]">
                    学校
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-muted-foreground tracking-wider w-[80px]">
                    状態
                  </th>
                  <th className="w-[40px]">
                    <span className="sr-only">詳細</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <StudentCard key={p.id} profile={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Student Dialog */}
        <Dialog open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addDialogTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">{t("nameLabel")}</Label>
                <Input
                  id="add-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="add-grade">{t("gradeLabel")}</Label>
                <Input
                  id="add-grade"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder={t("gradePlaceholder")}
                />
              </div>
              <div>
                <Label>科目</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    placeholder="例: 数学"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = newSubjectInput.trim();
                        if (v && !newSubjects.includes(v)) {
                          setNewSubjects((prev) => [...prev, v]);
                          setNewSubjectInput("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      !newSubjectInput.trim() ||
                      newSubjects.includes(newSubjectInput.trim())
                    }
                    onClick={() => {
                      const v = newSubjectInput.trim();
                      if (v && !newSubjects.includes(v)) {
                        setNewSubjects((prev) => [...prev, v]);
                        setNewSubjectInput("");
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {newSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newSubjects.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 text-xs rounded-md px-2 py-1"
                      >
                        {s}
                        <button
                          type="button"
                          className="hover:text-destructive"
                          onClick={() =>
                            setNewSubjects((prev) =>
                              prev.filter((x) => x !== s),
                            )
                          }
                          aria-label={`${s}を削除`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAdd(false)}
                disabled={saving}
              >
                {tc("cancel")}
              </Button>
              <LoadingButton
                onClick={handleAdd}
                loading={saving}
                disabled={!newName.trim()}
              >
                {tc("add")}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
