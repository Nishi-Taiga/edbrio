'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from 'next-intl'

interface SkillFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (skill: { subject: string; topic: string; rating: number; notes?: string; last_assessed_at: string }) => Promise<void>
}

export function SkillForm({ open, onClose, onSubmit }: SkillFormProps) {
  const t = useTranslations('curriculum.skills')
  const tc = useTranslations('common')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [rating, setRating] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !topic.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        subject: subject.trim(),
        topic: topic.trim(),
        rating,
        notes: notes.trim() || undefined,
        last_assessed_at: new Date().toISOString().split('T')[0],
      })
      setSubject(''); setTopic(''); setRating(3); setNotes('')
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
            <Label htmlFor="skill-subject">{t('subjectLabel')}</Label>
            <Input id="skill-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('subjectPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="skill-topic">{t('topicLabel')}</Label>
            <Input id="skill-topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('topicPlaceholder')} />
          </div>
          <div>
            <Label>{t('ratingLabel')}</Label>
            <Select value={String(rating)} onValueChange={(v) => setRating(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('rating1')}</SelectItem>
                <SelectItem value="2">{t('rating2')}</SelectItem>
                <SelectItem value="3">{t('rating3')}</SelectItem>
                <SelectItem value="4">{t('rating4')}</SelectItem>
                <SelectItem value="5">{t('rating5')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="skill-notes">{t('notesLabel')}</Label>
            <textarea
              id="skill-notes"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tc('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving || !subject.trim() || !topic.trim()}>
            {saving ? tc('adding') : tc('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
