import type {
  CurriculumMaterial,
  CurriculumPhase,
  ExamSchedule,
  PhaseTask,
} from '@/lib/types/database'

type ExportResult = { success: boolean; error?: string }

export async function exportCurriculumPDF(
  ganttElement: HTMLElement,
  studentName: string
): Promise<ExportResult> {
  try {
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.jsPDF

    const canvas = await html2canvas(ganttElement, {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    // Title
    pdf.setFontSize(16)
    pdf.text(`${studentName} カリキュラム`, margin, margin + 8)

    // Date
    const now = new Date()
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
    pdf.setFontSize(10)
    pdf.text(`出力日: ${dateStr}`, margin, margin + 16)

    // Image from canvas
    const imgData = canvas.toDataURL('image/png')
    const canvasAspect = canvas.width / canvas.height
    const availableWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2 - 22 // space for title + date
    let imgWidth = availableWidth
    let imgHeight = imgWidth / canvasAspect

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight * canvasAspect
    }

    pdf.addImage(imgData, 'PNG', margin, margin + 22, imgWidth, imgHeight)

    pdf.save(`${studentName}_カリキュラム.pdf`)

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'PDF出力に失敗しました'
    return { success: false, error: message }
  }
}

export async function exportCurriculumExcel(data: {
  studentName: string
  materials: CurriculumMaterial[]
  phases: CurriculumPhase[]
  exams: ExamSchedule[]
  phaseTasks: PhaseTask[]
}): Promise<ExportResult> {
  try {
    const XLSX = await import('xlsx')

    const { studentName, materials, phases, exams, phaseTasks } = data

    const wb = XLSX.utils.book_new()

    // ---- Sheet 1: カリキュラム ----
    const curriculumRows: Record<string, string | number>[] = []

    for (const material of materials) {
      const materialPhases = phases
        .filter((p) => p.material_id === material.id)
        .sort((a, b) => a.order_index - b.order_index)

      for (const phase of materialPhases) {
        const tasksForPhase = phaseTasks.filter(
          (t) => t.phase_id === phase.id
        )
        let progressPercent: number
        if (tasksForPhase.length > 0) {
          const completedCount = tasksForPhase.filter(
            (t) => t.is_completed
          ).length
          progressPercent = Math.round(
            (completedCount / tasksForPhase.length) * 100
          )
        } else {
          switch (phase.status) {
            case 'completed':
              progressPercent = 100
              break
            case 'in_progress':
              progressPercent = 50
              break
            case 'not_started':
            default:
              progressPercent = 0
              break
          }
        }

        const statusLabel =
          phase.status === 'completed'
            ? '完了'
            : phase.status === 'in_progress'
              ? '進行中'
              : '未着手'

        curriculumRows.push({
          科目: material.subject,
          教材名: material.material_name,
          ペース: material.study_pace ?? '',
          フェーズ: phase.phase_name,
          '所要時間(h)': phase.total_hours ?? '',
          開始日: phase.start_date ?? '',
          終了日: phase.end_date ?? '',
          ステータス: statusLabel,
          進捗率: progressPercent,
        })
      }
    }

    const ws1 = XLSX.utils.json_to_sheet(curriculumRows)
    autoSizeColumns(ws1, curriculumRows)
    XLSX.utils.book_append_sheet(wb, ws1, 'カリキュラム')

    // ---- Sheet 2: 入試スケジュール ----
    const examRows = exams.map((exam) => ({
      '大学/試験名': exam.exam_name,
      方式: exam.method ?? '',
      カテゴリ: formatExamCategory(exam.exam_category),
      日付: exam.exam_date,
    }))

    const ws2 = XLSX.utils.json_to_sheet(
      examRows.length > 0 ? examRows : [{ '大学/試験名': '', 方式: '', カテゴリ: '', 日付: '' }]
    )
    autoSizeColumns(ws2, examRows)
    XLSX.utils.book_append_sheet(wb, ws2, '入試スケジュール')

    // ---- Sheet 3: タスク一覧 ----
    const taskRows: Record<string, string | number>[] = []

    for (const material of materials) {
      const materialPhases = phases
        .filter((p) => p.material_id === material.id)
        .sort((a, b) => a.order_index - b.order_index)

      for (const phase of materialPhases) {
        const tasksForPhase = phaseTasks
          .filter((t) => t.phase_id === phase.id)
          .sort((a, b) => a.order_index - b.order_index)

        for (const task of tasksForPhase) {
          taskRows.push({
            教材: material.material_name,
            フェーズ: phase.phase_name,
            タスク名: task.task_name,
            完了: task.is_completed ? 'はい' : 'いいえ',
          })
        }
      }
    }

    const ws3 = XLSX.utils.json_to_sheet(
      taskRows.length > 0 ? taskRows : [{ 教材: '', フェーズ: '', タスク名: '', 完了: '' }]
    )
    autoSizeColumns(ws3, taskRows)
    XLSX.utils.book_append_sheet(wb, ws3, 'タスク一覧')

    XLSX.writeFile(wb, `${studentName}_カリキュラム.xlsx`)

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Excel出力に失敗しました'
    return { success: false, error: message }
  }
}

function autoSizeColumns(
  ws: import('xlsx').WorkSheet,
  rows: Record<string, string | number>[]
): void {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const colWidths = headers.map((header) => {
    const headerLen = getStringWidth(header)
    const maxDataLen = rows.reduce((max, row) => {
      const val = row[header]
      const len = getStringWidth(String(val ?? ''))
      return Math.max(max, len)
    }, 0)
    return Math.max(headerLen, maxDataLen) + 2
  })

  ws['!cols'] = colWidths.map((w) => ({ wch: w }))
}

function getStringWidth(str: string): number {
  let width = 0
  for (const char of str) {
    // CJK characters and full-width characters count as 2
    const code = char.codePointAt(0) ?? 0
    if (
      (code >= 0x3000 && code <= 0x9fff) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

function formatExamCategory(category: string): string {
  switch (category) {
    case 'recommendation':
      return '推薦'
    case 'common_test':
      return '共通テスト'
    case 'general':
      return '一般'
    case 'certification':
      return '検定'
    case 'school_exam':
      return '定期テスト'
    default:
      return category
  }
}
