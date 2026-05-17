"use client";

import { useMemo } from "react";
import { Plus, Trash2, Pencil, Calendar, GraduationCap } from "lucide-react";
import { ExamSchedule } from "@/lib/types/database";
import { format, isBefore, startOfDay } from "date-fns";

interface ExamScheduleListProps {
  exams: ExamSchedule[];
  academicYear?: number;
  onAdd: (date?: string) => void;
  onEdit: (exam: ExamSchedule) => void;
  onDelete: (id: string) => Promise<void>;
  readOnly?: boolean;
  t: (key: string) => string;
}

const statusConfig = (examDate: string) => {
  const today = startOfDay(new Date());
  const date = new Date(examDate);
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (isBefore(date, today)) {
    return { label: "終了", bg: "#F3F4F6", color: "#6B7280" };
  }
  if (daysUntil <= 14) {
    return { label: "直前", bg: "#FEE2E2", color: "#EF4444" };
  }
  if (daysUntil <= 60) {
    return { label: "準備中", bg: "#FEF3C7", color: "#D97706" };
  }
  return { label: "予定", bg: "#DBEAFE", color: "#3B82F6" };
};

/** Check if an exam date falls within the given academic year (April–March) */
function isInAcademicYear(examDate: string, year: number): boolean {
  const date = new Date(examDate);
  const start = new Date(year, 3, 1);
  const end = new Date(year + 1, 2, 31, 23, 59, 59);
  return date >= start && date <= end;
}

function formatBorderScore(exam: ExamSchedule): string {
  if (exam.border_score == null) return "—";
  const type = exam.border_score_type ?? "deviation";
  if (type === "percentage") return `${exam.border_score}%`;
  return `偏差値 ${exam.border_score}`;
}

const ENTRANCE_CATEGORIES = new Set([
  "recommendation",
  "common_test",
  "general",
]);

function ExamTable({
  exams,
  onEdit,
  onDelete,
  showPreference,
  showMethod = true,
  showBorder = true,
  readOnly = false,
}: {
  exams: ExamSchedule[];
  onEdit: (exam: ExamSchedule) => void;
  onDelete: (id: string) => Promise<void>;
  showPreference: boolean;
  showMethod?: boolean;
  showBorder?: boolean;
  readOnly?: boolean;
}) {
  if (exams.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        データがありません
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F9FAFB] dark:bg-muted/30">
            {showPreference && (
              <th className="text-center py-2 px-2 text-[11px] font-bold text-muted-foreground tracking-wider w-[50px]">
                志望順
              </th>
            )}
            <th className="text-left py-2 px-3 text-[11px] font-bold text-muted-foreground tracking-wider">
              試験名
            </th>
            {showMethod && (
              <th className="text-left py-2 px-3 text-[11px] font-bold text-muted-foreground tracking-wider hidden sm:table-cell">
                種類
              </th>
            )}
            {showBorder && (
              <th className="text-right py-2 px-3 text-[11px] font-bold text-muted-foreground tracking-wider w-[80px] hidden sm:table-cell">
                ボーダー
              </th>
            )}
            <th className="text-left py-2 px-3 text-[11px] font-bold text-muted-foreground tracking-wider w-[60px]">
              日付
            </th>
            <th className="text-left py-2 px-3 text-[11px] font-bold text-muted-foreground tracking-wider w-[70px] hidden sm:table-cell">
              状態
            </th>
            {!readOnly && (
              <th className="w-[50px]">
                <span className="sr-only">操作</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => {
            const status = statusConfig(exam.exam_date);
            return (
              <tr
                key={exam.id}
                className="border-t border-border hover:bg-muted/20 transition-colors group"
              >
                {showPreference && (
                  <td className="py-2 px-2 text-center text-xs font-bold text-foreground">
                    {exam.preference_order ? `第${exam.preference_order}` : "—"}
                  </td>
                )}
                <td className="py-2 px-3 font-semibold text-foreground text-xs">
                  {exam.exam_name}
                </td>
                {showMethod && (
                  <td className="py-2 px-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {exam.method || "—"}
                  </td>
                )}
                {showBorder && (
                  <td className="py-2 px-3 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                    {formatBorderScore(exam)}
                  </td>
                )}
                <td className="py-2 px-3 font-medium text-foreground text-xs whitespace-nowrap">
                  {format(new Date(exam.exam_date), "M/d")}
                </td>
                <td className="py-2 px-3 hidden sm:table-cell">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    {status.label}
                  </span>
                </td>
                {!readOnly && (
                  <td className="py-2 px-2">
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded hover:bg-muted"
                        onClick={() => onEdit(exam)}
                        aria-label={`${exam.exam_name}を編集`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-muted"
                        onClick={() => onDelete(exam.id)}
                        aria-label={`${exam.exam_name}を削除`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ExamScheduleList({
  exams,
  academicYear,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
}: ExamScheduleListProps) {
  const filtered = useMemo(() => {
    if (academicYear == null) return exams;
    return exams.filter((e) => isInAcademicYear(e.exam_date, academicYear));
  }, [exams, academicYear]);

  // Split into entrance exams vs school exams
  const entranceExams = useMemo(
    () =>
      [...filtered]
        .filter((e) => ENTRANCE_CATEGORIES.has(e.exam_category))
        .sort((a, b) => {
          const aOrder = a.preference_order ?? 999;
          const bOrder = b.preference_order ?? 999;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (
            new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
          );
        }),
    [filtered],
  );

  const schoolExams = useMemo(
    () =>
      [...filtered]
        .filter((e) => !ENTRANCE_CATEGORIES.has(e.exam_category))
        .sort(
          (a, b) =>
            new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime(),
        ),
    [filtered],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 試験スケジュール（左） */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-[18px] h-[18px] text-orange-500" />
            <h2 className="text-sm font-bold text-foreground">
              試験スケジュール
            </h2>
          </div>
          {!readOnly && (
            <button
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
              onClick={() => onAdd()}
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </button>
          )}
        </div>
        <div className="px-5 pb-4">
          <ExamTable
            exams={schoolExams}
            onEdit={onEdit}
            onDelete={onDelete}
            showPreference={false}
            showMethod={true}
            showBorder={false}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* 入試スケジュール（右） */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-[18px] h-[18px] text-blue-500" />
            <h2 className="text-sm font-bold text-foreground">
              入試スケジュール
            </h2>
          </div>
          {!readOnly && (
            <button
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
              onClick={() => onAdd()}
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </button>
          )}
        </div>
        <div className="px-5 pb-4">
          <ExamTable
            exams={entranceExams}
            onEdit={onEdit}
            onDelete={onDelete}
            showPreference={true}
            showMethod={true}
            readOnly={readOnly}
            showBorder={true}
          />
        </div>
      </div>
    </div>
  );
}
