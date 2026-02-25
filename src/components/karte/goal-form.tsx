'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (goal: { title: string; description?: string; subject?: string; target_date?: string; status: 'active'; progress: number }) => Promise<void>
}

export function GoalForm({ open, onClose, onSubmit }: GoalFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject.trim() || undefined,
        target_date: targetDate || undefined,
        status: 'active',
        progress: 0,
      })
      setTitle(''); setDescription(''); setSubject(''); setTargetDate('')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>学習目標を追加</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="goal-title">目標 *</Label>
            <Input id="goal-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 数学の基礎計算を完璧にする" />
          </div>
          <div>
            <Label htmlFor="goal-subject">教科</Label>
            <Input id="goal-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="例: 数学" />
          </div>
          <div>
            <Label htmlFor="goal-desc">詳細</Label>
            <textarea
              id="goal-desc"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="goal-date">達成目標日</Label>
            <Input id="goal-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? '追加中...' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
