'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const TEST_TYPES = [
  'school_exam',
  'mock_exam',
  'quiz',
  'entrance_exam',
  'other',
] as const

interface TestScoreFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (score: { test_name: string; test_type: string; subject: string; score: number; max_score: number; percentile?: number; test_date: string; notes?: string }) => Promise<void>
  initialData?: Partial<{ test_name: string; test_type: string; subject: string; score: number; max_score: number; percentile?: number; test_date: string; notes?: string }>
  t: (key: string) => string
}

export function TestScoreForm({ open, onOpenChange, onSubmit, initialData, t }: TestScoreFormProps) {
  const [testName, setTestName] = useState('')
  const [testType, setTestType] = useState('')
  const [subject, setSubject] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const [percentile, setPercentile] = useState('')
  const [testDate, setTestDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTestName(initialData?.test_name ?? '')
      setTestType(initialData?.test_type ?? '')
      setSubject(initialData?.subject ?? '')
      setScore(initialData?.score != null ? String(initialData.score) : '')
      setMaxScore(initialData?.max_score != null ? String(initialData.max_score) : '100')
      setPercentile(initialData?.percentile != null ? String(initialData.percentile) : '')
      setTestDate(initialData?.test_date ?? '')
      setNotes(initialData?.notes ?? '')
    }
  }, [open, initialData])

  const handleSubmit = async () => {
    if (!testName.trim() || !subject.trim() || !score || !testDate) return
    setSaving(true)
    try {
      await onSubmit({
        test_name: testName.trim(),
        test_type: testType,
        subject: subject.trim(),
        score: Number(score),
        max_score: Number(maxScore) || 100,
        percentile: percentile ? Number(percentile) : undefined,
        test_date: testDate,
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
          <DialogTitle>{isEdit ? t('editTestScore') : t('addTestScore')}</DialogTitle>
          <DialogDescription>{isEdit ? t('editTestScoreDescription') : t('addTestScoreDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-name">{t('testName')}</Label>
            <Input
              id="test-name"
              value={testName}
              onChange={e => setTestName(e.target.value)}
              placeholder={t('testNamePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="test-type">{t('testType')}</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger id="test-type">
                <SelectValue placeholder={t('testTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`testType_${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="test-subject">{t('subject')}</Label>
            <Input
              id="test-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('subjectPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-score">{t('score')}</Label>
              <Input
                id="test-score"
                type="number"
                min={0}
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder={t('scorePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="test-max-score">{t('maxScore')}</Label>
              <Input
                id="test-max-score"
                type="number"
                min={1}
                value={maxScore}
                onChange={e => setMaxScore(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="test-percentile">{t('percentile')}</Label>
            <Input
              id="test-percentile"
              type="number"
              min={0}
              step={0.1}
              value={percentile}
              onChange={e => setPercentile(e.target.value)}
              placeholder={t('percentilePlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="test-date">{t('testDate')}</Label>
            <Input
              id="test-date"
              type="date"
              value={testDate}
              onChange={e => setTestDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="test-notes">{t('notes')}</Label>
            <Textarea
              id="test-notes"
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
          <Button onClick={handleSubmit} disabled={saving || !testName.trim() || !subject.trim() || !score || !testDate}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('save') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
