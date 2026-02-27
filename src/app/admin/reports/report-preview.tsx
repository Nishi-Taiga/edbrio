'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface ReportPreviewProps {
  report: {
    id: string
    subject?: string
    content_public?: string
    content_raw?: string
    ai_summary?: string
    comprehension_level?: number
    student_mood?: string
    homework?: string
    next_plan?: string
    created_at: string
  }
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const [open, setOpen] = useState(false)
  const content = report.content_public || report.content_raw || ''
  const preview = content.slice(0, 100) + (content.length > 100 ? '...' : '')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-left text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        {preview || '—'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{report.subject || 'レポート詳細'}</DialogTitle>
            <DialogDescription>
              {new Date(report.created_at).toLocaleString('ja-JP')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {content && (
              <div>
                <h4 className="font-medium mb-1">内容</h4>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{content}</p>
              </div>
            )}
            {report.ai_summary && (
              <div>
                <h4 className="font-medium mb-1">AI要約</h4>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{report.ai_summary}</p>
              </div>
            )}
            {report.homework && (
              <div>
                <h4 className="font-medium mb-1">宿題</h4>
                <p className="text-gray-700 dark:text-gray-300">{report.homework}</p>
              </div>
            )}
            {report.next_plan && (
              <div>
                <h4 className="font-medium mb-1">次回の予定</h4>
                <p className="text-gray-700 dark:text-gray-300">{report.next_plan}</p>
              </div>
            )}
            <div className="flex gap-4">
              {report.comprehension_level != null && (
                <div>
                  <span className="text-gray-500">理解度:</span> {report.comprehension_level}/5
                </div>
              )}
              {report.student_mood && (
                <div>
                  <span className="text-gray-500">生徒の様子:</span> {report.student_mood}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
