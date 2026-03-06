'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (goal: { title: string; description?: string; subject?: string; target_date?: string; status: 'active'; progress: number }) => Promise<void>
}

export function GoalForm({ open, onClose, onSubmit }: GoalFormProps) {
  const t = useTranslations('curriculum.goals')
  const tc = useTranslations('common')
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
          <DialogTitle>{t('addTitle')}</DialogTitle>
          <DialogDescription>{t('addDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="goal-title">{t('goalLabel')}</Label>
            <Input id="goal-title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('goalPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="goal-subject">{t('subjectLabel')}</Label>
            <Input id="goal-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('subjectPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="goal-desc">{t('detailLabel')}</Label>
            <textarea
              id="goal-desc"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="goal-date">{t('targetDateLabel')}</Label>
            <Input id="goal-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tc('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? tc('adding') : tc('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
