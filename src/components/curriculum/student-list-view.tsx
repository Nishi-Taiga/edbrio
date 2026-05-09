"use client";

import { useMemo, useState } from "react";
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
import { LoadingButton } from "@/components/ui/loading-button";
import { StudentCard } from "@/components/curriculum/student-card";
import { useTranslations } from "next-intl";
import { StudentProfile } from "@/lib/types/database";

interface StudentListViewProps {
  profiles: StudentProfile[];
  loading: boolean;
  error: string | null;
  createProfile: (
    data: Omit<
      StudentProfile,
      "id" | "teacher_id" | "created_at" | "updated_at"
    >,
  ) => Promise<void>;
  updateProfile?: (
    id: string,
    updates: Partial<StudentProfile>,
  ) => Promise<void>;
  deleteProfile?: (id: string) => Promise<void>;
  basePath?: string;
}

export function StudentListView({
  profiles,
  loading,
  error,
  createProfile,
  updateProfile,
  deleteProfile,
  basePath = "/teacher/curriculum",
}: StudentListViewProps) {
  const t = useTranslations("teacherStudents");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [hideInactive, setHideInactive] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newSubjects, setNewSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation state
  const [deletingProfile, setDeletingProfile] = useState<StudentProfile | null>(
    null,
  );
  const [deleteSaving, setDeleteSaving] = useState(false);

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
      return p.name.toLowerCase().includes(search.toLowerCase());
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

  return (
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
                <StudentCard
                  key={p.id}
                  profile={p}
                  basePath={basePath}
                  onEdit={
                    updateProfile
                      ? (profile) => {
                          setEditingProfile(profile);
                          setEditName(profile.name);
                        }
                      : undefined
                  }
                  onDelete={
                    deleteProfile
                      ? (profile) => {
                          setDeletingProfile(profile);
                        }
                      : undefined
                  }
                />
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
              <Label>{t("gradeLabel")}</Label>
              <Select value={newGrade} onValueChange={setNewGrade}>
                <SelectTrigger aria-label={t("gradeLabel")}>
                  <SelectValue placeholder={t("gradePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="小学1年">小学1年</SelectItem>
                  <SelectItem value="小学2年">小学2年</SelectItem>
                  <SelectItem value="小学3年">小学3年</SelectItem>
                  <SelectItem value="小学4年">小学4年</SelectItem>
                  <SelectItem value="小学5年">小学5年</SelectItem>
                  <SelectItem value="小学6年">小学6年</SelectItem>
                  <SelectItem value="中学1年">中学1年</SelectItem>
                  <SelectItem value="中学2年">中学2年</SelectItem>
                  <SelectItem value="中学3年">中学3年</SelectItem>
                  <SelectItem value="高校1年">高校1年</SelectItem>
                  <SelectItem value="高校2年">高校2年</SelectItem>
                  <SelectItem value="高校3年">高校3年</SelectItem>
                  <SelectItem value="浪人">浪人</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
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
                          setNewSubjects((prev) => prev.filter((x) => x !== s))
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

      {/* Edit Student Name Dialog */}
      <Dialog
        open={!!editingProfile}
        onOpenChange={(v) => !v && setEditingProfile(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生徒名を編集</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="edit-name">名前</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProfile(null)}
              disabled={editSaving}
            >
              {tc("cancel")}
            </Button>
            <LoadingButton
              loading={editSaving}
              disabled={!editName.trim()}
              onClick={async () => {
                if (!editingProfile || !updateProfile) return;
                setEditSaving(true);
                try {
                  await updateProfile(editingProfile.id, {
                    name: editName.trim(),
                  });
                  setEditingProfile(null);
                  toast.success("生徒名を更新しました");
                } catch {
                  toast.error("更新に失敗しました");
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              {tc("save")}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingProfile}
        onOpenChange={(v) => !v && setDeletingProfile(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生徒を削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {deletingProfile?.name}
            </span>
            のカリキュラムデータをすべて削除します。この操作は取り消せません。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingProfile(null)}
              disabled={deleteSaving}
            >
              {tc("cancel")}
            </Button>
            <LoadingButton
              variant="destructive"
              loading={deleteSaving}
              onClick={async () => {
                if (!deletingProfile || !deleteProfile) return;
                setDeleteSaving(true);
                try {
                  await deleteProfile(deletingProfile.id);
                  setDeletingProfile(null);
                  toast.success("生徒を削除しました");
                } catch {
                  toast.error("削除に失敗しました");
                } finally {
                  setDeleteSaving(false);
                }
              }}
            >
              削除する
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
