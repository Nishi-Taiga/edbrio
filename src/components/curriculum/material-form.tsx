'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

interface MaterialFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (material: { material_name: string; subject: string; color?: string; notes?: string }) => Promise<void>
  initialData?: { material_name: string; subject: string; color?: string; notes?: string }
  existingSubjects?: string[]
  t: (key: string) => string
}

export function MaterialForm({ open, onOpenChange, onSubmit, initialData, existingSubjects, t }: MaterialFormProps) {
  const [materialName, setMaterialName] = useState('')
  const [subject, setSubject] = useState('')
  const [color, setColor] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setMaterialName(initialData?.material_name ?? '')
      setSubject(initialData?.subject ?? '')
      setColor(initialData?.color ?? '')
      setNotes(initialData?.notes ?? '')
    }
  }, [open, initialData])

  const handleSubmit = async () => {
    if (!materialName.trim() || !subject.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        material_name: materialName.trim(),
        subject: subject.trim(),
        color: color || undefined,
        notes: notes.trim() || undefined,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initialData

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editMaterial') : t('addMaterial')}</DialogTitle>
          <DialogDescription>{isEdit ? t('editMaterialDescription') : t('addMaterialDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="material-name">{t('materialName')}</Label>
            <Input
              id="material-name"
              value={materialName}
              onChange={e => setMaterialName(e.target.value)}
              placeholder={t('materialNamePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="material-subject">{t('subject')}</Label>
            {existingSubjects && existingSubjects.length > 0 ? (
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('subjectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {existingSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="material-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={t('subjectPlaceholder')}
                className="mt-1"
              />
            )}
          </div>
          <div>
            <Label>{t('color')}</Label>
            <div className="flex items-center gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="material-notes">{t('notes')}</Label>
            <Textarea
              id="material-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !materialName.trim() || !subject.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('save') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
