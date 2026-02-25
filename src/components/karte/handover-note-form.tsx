'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface HandoverNoteFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (note: { content: string; to_teacher_id?: string | null }) => Promise<void>
}

export function HandoverNoteForm({ open, onClose, onSubmit }: HandoverNoteFormProps) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSubmit({ content: content.trim() })
      setContent('')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>引継ぎメモを追加</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="handover-content">メモ内容 *</Label>
            <Textarea
              id="handover-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: 分数の通分でつまずきがち。具体的な数字で説明すると理解しやすい。"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={saving || !content.trim()}>
            {saving ? '追加中...' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
