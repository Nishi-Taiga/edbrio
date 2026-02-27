'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PointFormProps {
  open: boolean
  onClose: () => void
  type: 'weakness' | 'strength'
  onSubmitWeakness?: (wp: { subject: string; topic: string; severity: 'low' | 'medium' | 'high'; notes?: string; status: 'active'; identified_at: string }) => Promise<void>
  onSubmitStrength?: (s: { subject: string; topic: string; notes?: string }) => Promise<void>
}

export function PointForm({ open, onClose, type, onSubmitWeakness, onSubmitStrength }: PointFormProps) {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !topic.trim()) return
    setSaving(true)
    try {
      if (type === 'weakness' && onSubmitWeakness) {
        await onSubmitWeakness({
          subject: subject.trim(),
          topic: topic.trim(),
          severity,
          notes: notes.trim() || undefined,
          status: 'active',
          identified_at: new Date().toISOString().split('T')[0],
        })
      } else if (type === 'strength' && onSubmitStrength) {
        await onSubmitStrength({
          subject: subject.trim(),
          topic: topic.trim(),
          notes: notes.trim() || undefined,
        })
      }
      setSubject(''); setTopic(''); setSeverity('medium'); setNotes('')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === 'weakness' ? 'つまずきポイントを追加' : '得意分野を追加'}</DialogTitle>
          <DialogDescription>教科とトピックを入力してください</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="point-subject">教科 *</Label>
            <Input id="point-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="例: 数学" />
          </div>
          <div>
            <Label htmlFor="point-topic">トピック *</Label>
            <Input id="point-topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder={type === 'weakness' ? '例: 分数の割り算' : '例: リスニング'} />
          </div>
          {type === 'weakness' && (
            <div>
              <Label>重要度</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">軽微</SelectItem>
                  <SelectItem value="medium">注意</SelectItem>
                  <SelectItem value="high">重要</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="point-notes">メモ</Label>
            <textarea
              id="point-notes"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={saving || !subject.trim() || !topic.trim()}>
            {saving ? '追加中...' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
