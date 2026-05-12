import type {
  CurriculumMaterial,
  CurriculumPhase,
  ExamSchedule,
  PhaseTask,
} from "@/lib/types/database";
import { weekIndexToLabel } from "@/lib/curriculum/week";

type ExportResult = { success: boolean; error?: string };

export async function exportCurriculumPDF(
  ganttElement: HTMLElement,
  studentName: string,
): Promise<ExportResult> {
  try {
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.jsPDF;

    // Build date string before html2canvas so it's available in onclone
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

    // Mark element so we can find it in the cloned document
    ganttElement.setAttribute("data-pdf-root", "");

    const canvas = await html2canvas(ganttElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (doc) => {
        const view = doc.defaultView || window;
        const all = doc.querySelectorAll("*");
        all.forEach((el) => {
          const htmlEl = el as HTMLElement;
          try {
            const cs = view.getComputedStyle(el);
            // Fix oklch colors that html2canvas can't parse
            if (cs.color?.includes("oklch")) htmlEl.style.color = "#000000";
            if (cs.backgroundColor?.includes("oklch"))
              htmlEl.style.backgroundColor = "transparent";
            if (cs.borderColor?.includes("oklch"))
              htmlEl.style.borderColor = "#e5e7eb";
            // Fix CSS custom properties (var(--...)) that may not resolve
            if (cs.color?.includes("var(")) htmlEl.style.color = "#000000";
            if (cs.backgroundColor?.includes("var("))
              htmlEl.style.backgroundColor = "transparent";
            if (cs.borderColor?.includes("var("))
              htmlEl.style.borderColor = "#e5e7eb";
          } catch {
            // getComputedStyle may fail on some elements
          }
        });
        // Ensure scrollable areas are fully visible
        const scrollables = doc.querySelectorAll(
          "[style*='overflow'],.overflow-x-auto,.overflow-y-auto,.overflow-hidden",
        );
        scrollables.forEach((el) => {
          (el as HTMLElement).style.overflow = "visible";
        });

        // Prepend title & date as HTML so Japanese renders correctly
        const clonedRoot = doc.querySelector("[data-pdf-root]");
        if (clonedRoot) {
          const titleDiv = doc.createElement("div");
          titleDiv.textContent = `${studentName} カリキュラム`;
          titleDiv.style.cssText =
            "font-size:16px;font-weight:bold;padding:8px 12px 4px 12px;font-family:sans-serif;color:#000;";
          const dateDiv = doc.createElement("div");
          dateDiv.textContent = `出力日: ${dateStr}`;
          dateDiv.style.cssText =
            "font-size:10px;color:#666;padding:0 12px 8px 12px;font-family:sans-serif;";
          clonedRoot.insertBefore(dateDiv, clonedRoot.firstChild);
          clonedRoot.insertBefore(titleDiv, clonedRoot.firstChild);
        }
      },
    });

    // Remove temporary attribute
    ganttElement.removeAttribute("data-pdf-root");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Image from canvas (title & date are already rendered in the image)
    const imgData = canvas.toDataURL("image/png");
    const canvasAspect = canvas.width / canvas.height;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    let imgWidth = availableWidth;
    let imgHeight = imgWidth / canvasAspect;

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * canvasAspect;
    }

    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

    pdf.save(`${studentName}_カリキュラム.pdf`);

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF出力に失敗しました";
    return { success: false, error: message };
  }
}

export async function exportCurriculumExcel(data: {
  studentName: string;
  materials: CurriculumMaterial[];
  phases: CurriculumPhase[];
  exams: ExamSchedule[];
  phaseTasks: PhaseTask[];
}): Promise<ExportResult> {
  try {
    const XLSX = await import("xlsx");

    const { studentName, materials, phases, exams, phaseTasks } = data;

    const wb = XLSX.utils.book_new();

    // ---- Sheet 1: カリキュラム ----
    const curriculumRows: Record<string, string | number>[] = [];

    for (const material of materials) {
      const materialPhases = phases
        .filter((p) => p.material_id === material.id)
        .sort((a, b) => a.order_index - b.order_index);

      for (const phase of materialPhases) {
        const tasksForPhase = phaseTasks.filter((t) => t.phase_id === phase.id);
        let progressPercent: number;
        if (tasksForPhase.length > 0) {
          const completedCount = tasksForPhase.filter(
            (t) => t.is_completed,
          ).length;
          progressPercent = Math.round(
            (completedCount / tasksForPhase.length) * 100,
          );
        } else {
          switch (phase.status) {
            case "completed":
              progressPercent = 100;
              break;
            case "in_progress":
              progressPercent = 50;
              break;
            case "not_started":
            default:
              progressPercent = 0;
              break;
          }
        }

        const statusLabel =
          phase.status === "completed"
            ? "完了"
            : phase.status === "in_progress"
              ? "進行中"
              : "未着手";

        const yearNum = material.curriculum_year
          ? Number(material.curriculum_year)
          : NaN;
        const startWeekLabel =
          phase.start_week && Number.isFinite(yearNum)
            ? weekIndexToLabel(yearNum, phase.start_week)
            : (phase.start_date ?? "");
        const endWeekLabel =
          phase.end_week && Number.isFinite(yearNum)
            ? weekIndexToLabel(yearNum, phase.end_week)
            : (phase.end_date ?? "");
        curriculumRows.push({
          科目: material.subject,
          教材名: material.material_name,
          フェーズ: phase.phase_name,
          "所要時間(h)": phase.total_hours ?? "",
          開始週: startWeekLabel,
          終了週: endWeekLabel,
          ステータス: statusLabel,
          進捗率: progressPercent,
        });
      }
    }

    const ws1 = XLSX.utils.json_to_sheet(curriculumRows);
    autoSizeColumns(ws1, curriculumRows);
    XLSX.utils.book_append_sheet(wb, ws1, "カリキュラム");

    // ---- Sheet 2: 試験スケジュール ----
    const examRows = exams.map((exam) => ({
      試験名: exam.exam_name,
      種類: exam.method ?? "",
      カテゴリ: formatExamCategory(exam.exam_category),
      日付: exam.exam_date,
      ...(exam.preference_order ? { 志望順: exam.preference_order } : {}),
      ...(exam.border_score != null ? { ボーダー: exam.border_score } : {}),
    }));

    const ws2 = XLSX.utils.json_to_sheet(
      examRows.length > 0
        ? examRows
        : [{ 試験名: "", 種類: "", カテゴリ: "", 日付: "" }],
    );
    autoSizeColumns(ws2, examRows);
    XLSX.utils.book_append_sheet(wb, ws2, "試験スケジュール");

    // ---- Sheet 3: タスク一覧 ----
    const taskRows: Record<string, string | number>[] = [];

    for (const material of materials) {
      const materialPhases = phases
        .filter((p) => p.material_id === material.id)
        .sort((a, b) => a.order_index - b.order_index);

      for (const phase of materialPhases) {
        const tasksForPhase = phaseTasks
          .filter((t) => t.phase_id === phase.id)
          .sort((a, b) => a.order_index - b.order_index);

        for (const task of tasksForPhase) {
          taskRows.push({
            教材: material.material_name,
            フェーズ: phase.phase_name,
            タスク名: task.task_name,
            完了: task.is_completed ? "はい" : "いいえ",
          });
        }
      }
    }

    const ws3 = XLSX.utils.json_to_sheet(
      taskRows.length > 0
        ? taskRows
        : [{ 教材: "", フェーズ: "", タスク名: "", 完了: "" }],
    );
    autoSizeColumns(ws3, taskRows);
    XLSX.utils.book_append_sheet(wb, ws3, "タスク一覧");

    XLSX.writeFile(wb, `${studentName}_カリキュラム.xlsx`);

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Excel出力に失敗しました";
    return { success: false, error: message };
  }
}

function autoSizeColumns(
  ws: import("xlsx").WorkSheet,
  rows: Record<string, string | number>[],
): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const colWidths = headers.map((header) => {
    const headerLen = getStringWidth(header);
    const maxDataLen = rows.reduce((max, row) => {
      const val = row[header];
      const len = getStringWidth(String(val ?? ""));
      return Math.max(max, len);
    }, 0);
    return Math.max(headerLen, maxDataLen) + 2;
  });

  ws["!cols"] = colWidths.map((w) => ({ wch: w }));
}

function getStringWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    // CJK characters and full-width characters count as 2
    const code = char.codePointAt(0) ?? 0;
    if (
      (code >= 0x3000 && code <= 0x9fff) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

function formatExamCategory(category: string): string {
  switch (category) {
    case "recommendation":
      return "推薦";
    case "common_test":
      return "共通テスト";
    case "general":
      return "一般";
    case "certification":
      return "検定";
    case "school_exam":
      return "定期テスト";
    default:
      return category;
  }
}
