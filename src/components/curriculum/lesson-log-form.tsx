'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface LessonLogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (log: { lesson_date: string; subject: string; notes?: string }, phaseIds: string[]) => Promise<void>
  phases: Array<{ id: string; phase_name: string; material_name: string; subject: string }>
  t: (key: string) => string
}

export function LessonLogForm({ open, onOpenChange, onSubmit, phases, t }: LessonLogFormProps) {
  const [lessonDate, setLessonDate] = useState('')
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setLessonDate(new Date().toISOString().split('T')[0])
      setSubject('')
      setNotes('')
      setSelectedPhaseIds([])
    }
  }, [open])

  const togglePhase = (phaseId: string) => {
    setSelectedPhaseIds(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  const handleSubmit = async () => {
    if (!lessonDate || !subject.trim()) return
    setSaving(true)
    try {
      await onSubmit(
        {
          lesson_date: lessonDate,
          subject: subject.trim(),
          notes: notes.trim() || undefined,
        },
        selectedPhaseIds,
      )
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addLessonLog')}</DialogTitle>
          <DialogDescription>{t('addLessonLogDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="log-date">{t('lessonDate')}</Label>
            <Input
              id="log-date"
              type="date"
              value={lessonDate}
              onChange={e => setLessonDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="log-subject">{t('subject')}</Label>
            <Input
              id="log-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('subjectPlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="log-notes">{t('notes')}</Label>
            <Textarea
              id="log-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
            />
          </div>
          {phases.length > 0 && (
            <div>
              <Label>{t('coveredPhases')}</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto rounded-md border p-3">
                {phases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`phase-${phase.id}`}
                      checked={selectedPhaseIds.includes(phase.id)}
                      onCheckedChange={() => togglePhase(phase.id)}
                    />
                    <label
                      htmlFor={`phase-${phase.id}`}
                      className="text-sm leading-none cursor-pointer"
                    >
                      <span className="font-medium">{phase.phase_name}</span>
                      <span className="text-muted-foreground ml-1">
                        ({phase.material_name} / {phase.subject})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !lessonDate || !subject.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
