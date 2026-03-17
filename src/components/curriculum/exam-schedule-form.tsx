'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const EXAM_CATEGORIES = [
  'recommendation',
  'common_test',
  'general',
  'certification',
  'school_exam',
] as const

interface ExamFormData {
  exam_name: string
  exam_category: string
  method?: string
  exam_date: string
  preference_order?: number
  border_score?: number
  border_score_type?: 'deviation' | 'percentage'
  notes?: string
}

interface ExamScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (exam: ExamFormData) => Promise<void>
  initialData?: ExamFormData
  t: (key: string) => string
}

/** Allow only half-width digits (and empty string) */
function sanitizeHalfWidthDigits(value: string): string {
  return value.replace(/[^\d]/g, '')
}

/** Allow only numeric values (digits, decimal point) */
function sanitizeNumeric(value: string): string {
  // Allow digits and at most one decimal point
  const cleaned = value.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length <= 2) return cleaned
  return parts[0] + '.' + parts.slice(1).join('')
}

export function ExamScheduleForm({ open, onOpenChange, onSubmit, initialData, t }: ExamScheduleFormProps) {
  const [examName, setExamName] = useState('')
  const [examCategory, setExamCategory] = useState('')
  const [method, setMethod] = useState('')
  const [examDate, setExamDate] = useState('')
  const [preferenceOrder, setPreferenceOrder] = useState('')
  const [borderScore, setBorderScore] = useState('')
  const [borderScoreType, setBorderScoreType] = useState<'deviation' | 'percentage'>('deviation')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setExamName(initialData?.exam_name ?? '')
      setExamCategory(initialData?.exam_category ?? '')
      setMethod(initialData?.method ?? '')
      setExamDate(initialData?.exam_date ?? '')
      setPreferenceOrder(initialData?.preference_order != null ? String(initialData.preference_order) : '')
      setBorderScore(initialData?.border_score != null ? String(initialData.border_score) : '')
      setBorderScoreType(initialData?.border_score_type ?? 'deviation')
      setNotes(initialData?.notes ?? '')
    }
  }, [open, initialData])

  const handleSubmit = async () => {
    if (!examName.trim() || !examDate) return
    setSaving(true)
    try {
      await onSubmit({
        exam_name: examName.trim(),
        exam_category: examCategory,
        method: method.trim() || undefined,
        exam_date: examDate,
        preference_order: preferenceOrder ? Number(preferenceOrder) : undefined,
        border_score: borderScore ? Number(borderScore) : undefined,
        border_score_type: borderScore ? borderScoreType : undefined,
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
          <DialogTitle>{isEdit ? t('editExamSchedule') : t('addExamSchedule')}</DialogTitle>
          <DialogDescription>{isEdit ? t('editExamScheduleDescription') : t('addExamScheduleDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="exam-name">{t('examNameLabel')}</Label>
            <Input
              id="exam-name"
              value={examName}
              onChange={e => setExamName(e.target.value)}
              placeholder={t('examNamePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="exam-category">{t('examCategory')}</Label>
            <Select value={examCategory} onValueChange={setExamCategory}>
              <SelectTrigger id="exam-category">
                <SelectValue placeholder={t('examCategoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {EXAM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`examCategory_${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="exam-method">{t('method')}</Label>
            <Input
              id="exam-method"
              value={method}
              onChange={e => setMethod(e.target.value)}
              placeholder={t('methodPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exam-preference">{t('preferenceOrder')}</Label>
              <Input
                id="exam-preference"
                inputMode="numeric"
                pattern="[0-9]*"
                value={preferenceOrder}
                onChange={e => setPreferenceOrder(sanitizeHalfWidthDigits(e.target.value))}
                placeholder={t('preferenceOrderPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="exam-border">{t('borderScore')}</Label>
              <div className="flex gap-1.5">
                <Select value={borderScoreType} onValueChange={(v) => setBorderScoreType(v as 'deviation' | 'percentage')}>
                  <SelectTrigger className="w-[90px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deviation">{t('borderTypeDeviation')}</SelectItem>
                    <SelectItem value="percentage">{t('borderTypePercentage')}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="exam-border"
                  inputMode="decimal"
                  value={borderScore}
                  onChange={e => setBorderScore(sanitizeNumeric(e.target.value))}
                  placeholder={t('borderScorePlaceholder')}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="exam-date">{t('examDate')}</Label>
            <Input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="exam-notes">{t('notes')}</Label>
            <Textarea
              id="exam-notes"
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
          <Button onClick={handleSubmit} disabled={saving || !examName.trim() || !examDate}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('save') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
