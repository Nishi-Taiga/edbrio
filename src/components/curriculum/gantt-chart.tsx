"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CheckCircle, GripVertical } from "lucide-react";
import {
  CurriculumMaterial,
  CurriculumPhase,
  ExamSchedule,
  PhaseTask,
} from "@/lib/types/database";
import { differenceInDays, startOfDay, format } from "date-fns";
import { useGanttInteractions } from "@/components/curriculum/use-gantt-interactions";

// --- Constants ---
const LABEL_WIDTH = 180;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 44;
const SUBJECT_HEADER_HEIGHT = 28;
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]; // Academic year April–March
const MONTH_LABELS = [
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
  "1月",
  "2月",
  "3月",
];

// Subject color mapping (fixed by subject)
const SUBJECT_COLORS: Record<
  string,
  { color: string; bg: string; darkBg: string }
> = {
  国語: { color: "#BE123C", bg: "#FFF1F2", darkBg: "#2A1520" },
  算数: { color: "#2563EB", bg: "#EFF6FF", darkBg: "#151D2E" },
  数学: { color: "#2563EB", bg: "#EFF6FF", darkBg: "#151D2E" },
  理科: { color: "#15803D", bg: "#ECFDF5", darkBg: "#142620" },
  物理: { color: "#15803D", bg: "#ECFDF5", darkBg: "#142620" },
  化学: { color: "#059669", bg: "#ECFDF5", darkBg: "#142620" },
  生物: { color: "#16A34A", bg: "#ECFDF5", darkBg: "#142620" },
  社会: { color: "#D97706", bg: "#FFFBEB", darkBg: "#2A2214" },
  地理: { color: "#D97706", bg: "#FFFBEB", darkBg: "#2A2214" },
  歴史: { color: "#EA580C", bg: "#FFF7ED", darkBg: "#2A1F14" },
  英語: { color: "#7C3AED", bg: "#F5F3FF", darkBg: "#1C162E" },
};

/** Get color for a subject, with fallback for unknown subjects */
export function getSubjectColor(
  subject: string,
  dark = false,
): {
  color: string;
  bg: string;
} {
  const entry =
    SUBJECT_COLORS[subject] ??
    Object.entries(SUBJECT_COLORS).find(([key]) => subject.includes(key))?.[1];
  if (entry) return { color: entry.color, bg: dark ? entry.darkBg : entry.bg };
  return { color: "#6B7280", bg: dark ? "#1A1A1F" : "#F9FAFB" };
}

const EXAM_CATEGORY_COLORS: Record<string, string> = {
  recommendation: "#EF4444",
  common_test: "#F59E0B",
  general: "#3B82F6",
  certification: "#059669",
  school_exam: "#D97706",
};

// --- Types ---
interface GanttChartProps {
  materials: CurriculumMaterial[];
  phases: CurriculumPhase[];
  phaseTasks: PhaseTask[];
  exams: ExamSchedule[];
  curriculumYear?: string;
  onAddSubject: () => void;
  onAddMaterialToSubject: (subject: string) => void;
  onEditMaterial: (material: CurriculumMaterial) => void;
  onDeleteMaterial: (id: string) => void;
  onAddPhase: (
    materialId: string,
    startDate?: string,
    endDate?: string,
  ) => void;
  onEditPhase: (phase: CurriculumPhase) => void;
  onDeletePhase: (id: string) => void;
  onUpdatePhase: (
    id: string,
    updates: Partial<CurriculumPhase>,
  ) => Promise<void>;
  onReorderMaterials?: (
    updates: Array<{ id: string; order_index: number }>,
  ) => Promise<void>;
  onAddExam: (date?: string) => void;
  onPhaseClick?: (phase: CurriculumPhase, materialName: string) => void;
  t: (key: string) => string;
}

// --- Helpers ---
function getAcademicYear(yearStr?: string): number {
  return yearStr ? parseInt(yearStr) : new Date().getFullYear();
}

/** Get the start date of each month in the academic year (April to March) */
function getMonthStarts(year: number): Date[] {
  return MONTHS.map((m) => {
    const y = m >= 4 ? year : year + 1;
    return new Date(y, m - 1, 1);
  });
}

/** Get the last day of March of the next year (end of academic year) */
function getAcademicYearEnd(year: number): Date {
  return new Date(year + 1, 2, 31); // March 31
}

/** Convert a date to a pixel position within the chart timeline area */
function dateToX(
  date: Date,
  academicYearStart: Date,
  timelineWidth: number,
  totalDays: number,
): number {
  const days = differenceInDays(date, academicYearStart);
  return Math.max(
    0,
    Math.min(timelineWidth, (days / totalDays) * timelineWidth),
  );
}

// --- Component ---
export function GanttChart({
  materials,
  phases,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  phaseTasks,
  exams,
  curriculumYear,
  onAddSubject,
  onAddMaterialToSubject,
  onEditMaterial,
  onDeleteMaterial,
  onAddPhase,
  onEditPhase,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeletePhase,
  onUpdatePhase,
  onReorderMaterials,
  onAddExam,
  onPhaseClick,
  t,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(960);

  // Drag reorder state for materials and subjects
  const [reorderDrag, setReorderDrag] = useState<{
    type: "material" | "subject";
    id: string; // materialId or subject name
    subject: string;
    startIdx: number;
    currentIdx: number;
  } | null>(null);

  const handleReorderMouseDown = (
    e: React.MouseEvent,
    type: "material" | "subject",
    id: string,
    subject: string,
    idx: number,
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    setReorderDrag({ type, id, subject, startIdx: idx, currentIdx: idx });

    const getTargetIdx = (clientY: number) => {
      const delta = clientY - startY;
      const steps = Math.round(delta / rowHeight);
      return idx + steps;
    };

    const onMove = (me: MouseEvent) => {
      me.preventDefault();
      const newIdx = getTargetIdx(me.clientY);
      setReorderDrag((prev) => (prev ? { ...prev, currentIdx: newIdx } : null));
    };
    const onUp = (me: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const finalIdx = getTargetIdx(me.clientY);
      setReorderDrag(null);
      if (finalIdx === idx || !onReorderMaterials) return;

      if (type === "material") {
        // Reorder materials within the same subject
        const subjectMats = [...(grouped[subject] || [])];
        const fromIdx = subjectMats.findIndex((m) => m.id === id);
        if (fromIdx < 0) return;
        const toIdx = Math.max(
          0,
          Math.min(subjectMats.length - 1, fromIdx + (finalIdx - idx)),
        );
        if (fromIdx === toIdx) return;
        const [moved] = subjectMats.splice(fromIdx, 1);
        subjectMats.splice(toIdx, 0, moved);
        // Reassign order_index for this subject's materials
        const updates = subjectMats.map((m, i) => ({
          id: m.id,
          order_index: i,
        }));
        onReorderMaterials(updates);
      } else {
        // Reorder subjects: reassign order_index across all materials
        const subjectList = [...subjects];
        const fromIdx = subjectList.indexOf(id);
        if (fromIdx < 0) return;
        const toIdx = Math.max(
          0,
          Math.min(subjectList.length - 1, fromIdx + (finalIdx - idx)),
        );
        if (fromIdx === toIdx) return;
        const [moved] = subjectList.splice(fromIdx, 1);
        subjectList.splice(toIdx, 0, moved);
        // Flatten in new subject order and reassign order_index
        const updates: Array<{ id: string; order_index: number }> = [];
        let orderIdx = 0;
        for (const subj of subjectList) {
          for (const mat of grouped[subj]) {
            updates.push({ id: mat.id, order_index: orderIdx++ });
          }
        }
        onReorderMaterials(updates);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Detect dark mode (check closest ancestor with .dark class)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setIsDark(!!el.closest(".dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
    return () => obs.disconnect();
  }, []);

  const getSubjectStyle = (subject: string) => getSubjectColor(subject, isDark);

  const year = getAcademicYear(curriculumYear);
  const academicYearStart = useMemo(() => new Date(year, 3, 1), [year]); // April 1
  const academicYearEnd = useMemo(() => getAcademicYearEnd(year), [year]);
  const totalDays = differenceInDays(academicYearEnd, academicYearStart) + 1;
  const monthStarts = useMemo(() => getMonthStarts(year), [year]);

  // Mobile responsive values
  const isMobile = containerWidth < 640;
  const labelWidth = isMobile ? 120 : LABEL_WIDTH;
  const rowHeight = isMobile ? 36 : ROW_HEIGHT;

  // Timeline width = container width minus label column
  const timelineWidth = Math.max(containerWidth - labelWidth, 600);

  // Drag interactions (click-to-add, resize, move)
  const {
    skipClickRef,
    handleRowMouseDown,
    handleEdgeMouseDown,
    handleBarMouseDown,
    getVisualBounds,
    createPreview,
    xToDate,
  } = useGanttInteractions(
    timelineRef,
    timelineWidth,
    totalDays,
    academicYearStart,
    onUpdatePhase,
    onAddPhase,
  );

  // Observe container width
  useEffect(() => {
    const el = scrollRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Group materials by subject
  const grouped = useMemo(() => {
    const g: Record<string, CurriculumMaterial[]> = {};
    materials.forEach((m) => {
      if (!g[m.subject]) g[m.subject] = [];
      g[m.subject].push(m);
    });
    Object.values(g).forEach((arr) =>
      arr.sort((a, b) => a.order_index - b.order_index),
    );
    return g;
  }, [materials]);

  const subjects = Object.keys(grouped);

  const getPhases = (materialId: string) =>
    phases
      .filter((p) => p.material_id === materialId)
      .sort((a, b) => a.order_index - b.order_index);

  // Today line
  const todayX = useMemo(() => {
    const today = startOfDay(new Date());
    return dateToX(today, academicYearStart, timelineWidth, totalDays);
  }, [academicYearStart, timelineWidth, totalDays]);

  const todayVisible = (() => {
    const today = startOfDay(new Date());
    return today >= academicYearStart && today <= academicYearEnd;
  })();

  // Month column boundaries (x positions)
  const monthColumns = useMemo(() => {
    return monthStarts.map((start, i) => {
      const x = dateToX(start, academicYearStart, timelineWidth, totalDays);
      const nextStart =
        i < monthStarts.length - 1
          ? monthStarts[i + 1]
          : new Date(academicYearEnd.getTime() + 86400000);
      const xEnd = dateToX(
        nextStart,
        academicYearStart,
        timelineWidth,
        totalDays,
      );
      return { x, width: xEnd - x, label: MONTH_LABELS[i] };
    });
  }, [
    monthStarts,
    academicYearStart,
    timelineWidth,
    totalDays,
    academicYearEnd,
  ]);

  // Week boundary positions (every Monday)
  const weekLines = useMemo(() => {
    const lines: number[] = [];
    const cursor = new Date(academicYearStart);
    // Advance to first Monday
    while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() + 1);
    while (cursor <= academicYearEnd) {
      const x = dateToX(cursor, academicYearStart, timelineWidth, totalDays);
      lines.push(x);
      cursor.setDate(cursor.getDate() + 7);
    }
    return lines;
  }, [academicYearStart, academicYearEnd, timelineWidth, totalDays]);

  // Build row list
  type Row =
    | { type: "subject"; subject: string }
    | { type: "material"; subject: string; material: CurriculumMaterial }
    | { type: "addMaterial"; subject: string };
  const rows: Row[] = [];
  const ADD_MATERIAL_ROW_HEIGHT = 28;
  subjects.forEach((subject) => {
    rows.push({ type: "subject", subject });
    grouped[subject].forEach((material) => {
      rows.push({ type: "material", subject, material });
    });
    rows.push({ type: "addMaterial", subject });
  });

  // Compute exam marker layout to determine dynamic row height
  const EXAM_MARKER_ROW_H = 18;
  const examMarkerLayout = useMemo(() => {
    const markers = exams
      .map((exam) => {
        const examDate = new Date(exam.exam_date);
        const x = dateToX(
          examDate,
          academicYearStart,
          timelineWidth,
          totalDays,
        );
        const label =
          exam.exam_name.length > 6
            ? exam.exam_name.slice(0, 6) + "…"
            : exam.exam_name;
        const text = `${label} ${format(examDate, "M/d")}`;
        const estWidth = text.length * 7 + 12;
        return { x, estWidth, row: 0 };
      })
      .sort((a, b) => a.x - b.x);
    const rowEnds: number[] = [];
    for (const m of markers) {
      let placed = false;
      for (let r = 0; r < rowEnds.length; r++) {
        if (m.x >= rowEnds[r] + 4) {
          m.row = r;
          rowEnds[r] = m.x + m.estWidth;
          placed = true;
          break;
        }
      }
      if (!placed) {
        m.row = rowEnds.length;
        rowEnds.push(m.x + m.estWidth);
      }
    }
    return { rowCount: Math.max(1, rowEnds.length) };
  }, [exams, academicYearStart, timelineWidth, totalDays]);

  const examRowHeight = 4 + examMarkerLayout.rowCount * EXAM_MARKER_ROW_H + 4;

  // Total body height
  const getRowHeight = (r: Row) => {
    if (r.type === "subject") return SUBJECT_HEADER_HEIGHT;
    if (r.type === "addMaterial") return ADD_MATERIAL_ROW_HEIGHT;
    return rowHeight;
  };
  const bodyHeight =
    examRowHeight + rows.reduce((h, r) => h + getRowHeight(r), 0);

  // Render a phase bar with drag handles
  function renderPhaseBar(phase: CurriculumPhase, mat: CurriculumMaterial) {
    if (!phase.start_date || !phase.end_date) return null;
    // Hide phases completely outside the current academic year
    const phaseStart = new Date(phase.start_date);
    const phaseEnd = new Date(phase.end_date);
    if (phaseEnd < academicYearStart || phaseStart > academicYearEnd)
      return null;
    const rawX1 = dateToX(
      new Date(phase.start_date),
      academicYearStart,
      timelineWidth,
      totalDays,
    );
    const rawX2 = dateToX(
      new Date(phase.end_date),
      academicYearStart,
      timelineWidth,
      totalDays,
    );
    const rawWidth = Math.max(20, rawX2 - rawX1);

    // Apply drag/resize visual offsets
    const { left: x1, width: barWidth } = getVisualBounds(
      phase.id,
      rawX1,
      rawWidth,
    );

    const color = getSubjectStyle(mat.subject).color;
    const isCompleted = phase.status === "completed";

    // Text color: for light bars (like yellow #F1C232), use dark text
    const isLightColor = ["#F1C232", "#FDE047", "#FBBF24", "#D97706"].includes(
      color,
    );
    const textColor = isLightColor ? "#7C4A03" : "#FFFFFF";

    return (
      <div
        key={phase.id}
        data-phase-bar
        className="absolute flex flex-col rounded cursor-grab overflow-visible group/bar"
        style={{
          left: x1,
          width: barWidth,
          height: 20,
          top: 12,
          backgroundColor: color,
          zIndex: 5,
        }}
        onMouseDown={(e) => handleBarMouseDown(e, phase.id, rawX1, rawWidth)}
        onClick={() => {
          if (skipClickRef.current) return;
          if (onPhaseClick) {
            onPhaseClick(phase, mat.material_name);
          } else {
            onEditPhase(phase);
          }
        }}
        title={`${phase.phase_name}${phase.total_hours ? ` (${phase.total_hours}h)` : ""}`}
      >
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 opacity-0 group-hover/bar:opacity-100 hover:bg-white/30 rounded-l"
          onMouseDown={(e) =>
            handleEdgeMouseDown(e, phase.id, "left", rawX1, rawX1 + rawWidth)
          }
        />
        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 opacity-0 group-hover/bar:opacity-100 hover:bg-white/30 rounded-r"
          onMouseDown={(e) =>
            handleEdgeMouseDown(e, phase.id, "right", rawX1, rawX1 + rawWidth)
          }
        />
        <div className="flex items-center flex-1 min-h-0 overflow-hidden rounded">
          <span
            className={`${isMobile ? "text-[9px]" : "text-[10px]"} font-bold truncate leading-tight pl-2 pr-1`}
            style={{ color: textColor }}
          >
            {phase.phase_name}
          </span>
          {isCompleted && (
            <CheckCircle
              className="w-3 h-3 shrink-0 mr-1"
              style={{ color: "#10B981" }}
            />
          )}
        </div>
      </div>
    );
  }

  // Render exam markers on the exam row
  function renderExamMarkers() {
    const ROW_H = 18; // height per marker row
    const markers = exams
      .map((exam) => {
        const examDate = new Date(exam.exam_date);
        const x = dateToX(
          examDate,
          academicYearStart,
          timelineWidth,
          totalDays,
        );
        const color = EXAM_CATEGORY_COLORS[exam.exam_category] || "#6B7280";
        const bgColor = color + "20";
        const label =
          exam.exam_name.length > 6
            ? exam.exam_name.slice(0, 6) + "…"
            : exam.exam_name;
        const text = `${label} ${format(examDate, "M/d")}`;
        const estWidth = text.length * 7 + 12; // approximate rendered width
        return { exam, x, color, bgColor, text, estWidth, row: 0 };
      })
      .sort((a, b) => a.x - b.x);

    // Assign rows: place each marker in the first row where it doesn't overlap
    const rowEnds: number[] = []; // tracks the rightmost x-end of each row
    for (const m of markers) {
      let placed = false;
      for (let r = 0; r < rowEnds.length; r++) {
        if (m.x >= rowEnds[r] + 4) {
          // 4px gap
          m.row = r;
          rowEnds[r] = m.x + m.estWidth;
          placed = true;
          break;
        }
      }
      if (!placed) {
        m.row = rowEnds.length;
        rowEnds.push(m.x + m.estWidth);
      }
    }

    return markers.map((m) => (
      <div
        key={m.exam.id}
        className="absolute flex items-center gap-1 rounded text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 cursor-pointer hover:opacity-80"
        style={{
          left: m.x,
          top: 2 + m.row * ROW_H,
          backgroundColor: m.bgColor,
          color: m.color,
          zIndex: 10,
        }}
        title={`${m.exam.exam_name}${m.exam.method ? ` (${m.exam.method})` : ""}`}
      >
        {m.text}
      </div>
    ));
  }

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      ref={scrollRef}
    >
      {/* Header + Month columns */}
      <div className="flex" style={{ height: HEADER_HEIGHT }}>
        {/* Label column header */}
        <div
          className="flex flex-col justify-center px-4 border-r border-border shrink-0"
          style={{ width: labelWidth }}
        >
          <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
            教材 / 科目
          </span>
        </div>
        {/* Month headers */}
        <div className="flex flex-1 relative">
          {monthColumns.map((mc, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[11px] font-semibold text-muted-foreground border-r border-border/50 last:border-r-0"
              style={{ width: mc.width }}
            >
              {mc.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="flex border-t border-border">
        {/* Left labels */}
        <div
          className="shrink-0 border-r border-border"
          style={{ width: labelWidth }}
        >
          {/* Exam row label */}
          <div
            className="flex items-center gap-1.5 px-4 border-b border-border"
            style={{
              height: examRowHeight,
              backgroundColor: isDark ? "#2A1818" : "#FEF2F2",
            }}
          >
            <span className="text-[11px] font-bold text-red-500">
              {t("examScheduleLabel")}
            </span>
          </div>
          {/* Material/Subject labels */}
          {rows.map((row, idx) => {
            if (row.type === "subject") {
              const sc = getSubjectStyle(row.subject);
              const subjectIdx = subjects.indexOf(row.subject);
              const isDragging =
                reorderDrag?.type === "subject" &&
                reorderDrag.id === row.subject;
              return (
                <div
                  key={`label-${idx}`}
                  className={`flex items-center gap-1 px-1 border-b border-border group/subj ${isDragging ? "opacity-50" : ""}`}
                  style={{
                    height: SUBJECT_HEADER_HEIGHT,
                    backgroundColor: sc.bg,
                  }}
                >
                  <div
                    className="cursor-grab active:cursor-grabbing p-0.5 opacity-40 hover:opacity-70 transition-opacity"
                    onMouseDown={(e) =>
                      handleReorderMouseDown(
                        e,
                        "subject",
                        row.subject,
                        row.subject,
                        subjectIdx,
                      )
                    }
                    title="ドラッグして科目を並び替え"
                  >
                    <GripVertical
                      className="w-3.5 h-3.5"
                      style={{ color: sc.color }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: sc.color }}
                  >
                    {row.subject}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0 rounded"
                    style={{
                      backgroundColor: sc.bg,
                      color: sc.color,
                    }}
                  >
                    {grouped[row.subject].length}教材
                  </span>
                </div>
              );
            }
            if (row.type === "addMaterial") {
              const sc2 = getSubjectStyle(row.subject);
              return (
                <div
                  key={`label-${idx}`}
                  className="flex items-center justify-center border-b border-border"
                  style={{ height: ADD_MATERIAL_ROW_HEIGHT }}
                >
                  <button
                    className="flex items-center gap-0.5 text-[10px] font-medium transition-colors hover:opacity-80 px-2 py-0.5 rounded"
                    style={{ color: sc2.color }}
                    onClick={() => onAddMaterialToSubject(row.subject)}
                  >
                    <Plus className="w-3 h-3" />
                    {t("addMaterialToSubject")}
                  </button>
                </div>
              );
            }
            const mat = row.material;
            const matIdx = (grouped[row.subject] || []).indexOf(mat);
            const isDragging =
              reorderDrag?.type === "material" && reorderDrag.id === mat.id;
            return (
              <div
                key={`label-${idx}`}
                className={`flex items-center justify-between px-1 border-b border-border hover:bg-muted/30 transition-colors group/row ${isDragging ? "opacity-50" : ""}`}
                style={{ height: rowHeight }}
                onMouseEnter={() => setHoveredRow(mat.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div
                  className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover/row:opacity-40 transition-opacity shrink-0"
                  onMouseDown={(e) =>
                    handleReorderMouseDown(
                      e,
                      "material",
                      mat.id,
                      row.subject,
                      matIdx,
                    )
                  }
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 px-1">
                  <div
                    className={`${isMobile ? "text-[10px]" : "text-[11px]"} font-semibold text-foreground truncate`}
                  >
                    {mat.material_name}
                  </div>
                </div>
                {hoveredRow === mat.id && (
                  <div className="flex gap-0.5 shrink-0 ml-1">
                    <button
                      className="p-0.5 rounded hover:bg-muted"
                      onClick={() => onEditMaterial(mat)}
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      className="p-0.5 rounded hover:bg-muted"
                      onClick={() => onDeleteMaterial(mat.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Timeline area */}
        <div
          className="flex-1 relative overflow-x-auto"
          ref={timelineRef}
          tabIndex={0}
          role="region"
          aria-label="カリキュラムタイムライン"
        >
          <div
            style={{
              width: timelineWidth,
              position: "relative",
              height: bodyHeight,
            }}
          >
            {/* Week dotted lines */}
            {weekLines.map((x, i) => (
              <div
                key={`wl-${i}`}
                className="absolute top-0 bottom-0"
                style={{
                  left: x,
                  width: 0,
                  borderLeft: isDark
                    ? "1px dotted #ffffff10"
                    : "1px dotted #E5E7EB60",
                }}
              />
            ))}
            {/* Month solid lines */}
            {monthColumns.map((mc, i) => (
              <div
                key={`ml-${i}`}
                className="absolute top-0 bottom-0"
                style={{
                  left: mc.x + mc.width,
                  width: 0,
                  borderLeft: isDark
                    ? "1px solid #2A2538"
                    : "1px solid #D1D5DB",
                }}
              />
            ))}

            {/* Label separator line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: 0 }}
            />

            {/* Exam markers row — click to add exam at date */}
            <div
              className="relative border-b border-border cursor-crosshair"
              style={{
                height: examRowHeight,
                backgroundColor: isDark ? "#2A1818" : "#FEF2F2",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const date = xToDate(clickX);
                onAddExam(date);
              }}
            >
              {renderExamMarkers()}
            </div>

            {/* Material rows */}
            {(() => {
              let yOffset = examRowHeight;
              return rows.map((row, idx) => {
                const h = getRowHeight(row);
                const y = yOffset;
                yOffset += h;

                if (row.type === "subject") {
                  const sc = getSubjectStyle(row.subject);
                  return (
                    <div
                      key={`row-${idx}`}
                      className="absolute left-0 right-0 border-b border-border"
                      style={{ top: y, height: h, backgroundColor: sc.bg }}
                    />
                  );
                }

                if (row.type === "addMaterial") {
                  return (
                    <div
                      key={`row-${idx}`}
                      className="absolute left-0 right-0 border-b border-border"
                      style={{ top: y, height: h }}
                    />
                  );
                }

                const mat = row.material;
                return (
                  <div
                    key={`row-${idx}`}
                    className="absolute left-0 right-0 border-b border-border cursor-crosshair"
                    data-timeline-row={mat.id}
                    style={{ top: y, height: h }}
                    onMouseDown={(e) => handleRowMouseDown(e, mat.id)}
                  >
                    {getPhases(mat.id).map((phase) =>
                      renderPhaseBar(phase, mat),
                    )}
                    {/* Creation preview bar */}
                    {createPreview &&
                      createPreview.materialId === mat.id &&
                      (() => {
                        const previewStartDate = xToDate(createPreview.left);
                        const previewEndDate = xToDate(
                          createPreview.left + createPreview.width,
                        );
                        const startLabel = format(
                          new Date(previewStartDate),
                          "M/d",
                        );
                        const endLabel = format(
                          new Date(previewEndDate),
                          "M/d",
                        );
                        return (
                          <div
                            className="absolute rounded opacity-40 pointer-events-none"
                            style={{
                              left: createPreview.left,
                              width: createPreview.width,
                              height: 20,
                              top: 12,
                              backgroundColor: getSubjectStyle(mat.subject)
                                .color,
                              zIndex: 4,
                            }}
                          >
                            <div
                              className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-100 shadow"
                              style={{ zIndex: 10 }}
                            >
                              {startLabel} 〜 {endLabel}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                );
              });
            })()}

            {/* Today line */}
            {todayVisible && (
              <div
                className="absolute top-0 w-0.5 bg-red-500 z-[2] pointer-events-none"
                style={{ left: todayX, height: bodyHeight }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Empty state or Add subject button */}
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-t">
          <p className="text-sm mb-3">{t("emptyGantt")}</p>
          <Button size="sm" onClick={onAddSubject}>
            <Plus className="w-4 h-4 mr-1" />
            {t("addSubject")}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-2 border-t border-border">
          <button
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded hover:bg-muted/50"
            onClick={onAddSubject}
          >
            <Plus className="w-3.5 h-3.5" />
            {t("addSubject")}
          </button>
        </div>
      )}
    </div>
  );
}
