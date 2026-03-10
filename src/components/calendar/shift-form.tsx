'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RRule } from 'rrule'
import { useTranslations } from 'next-intl'

type RecurrenceType = 'none' | 'weekly' | 'biweekly'

interface ShiftFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: { startTime: string; endTime: string; rrule?: string }) => Promise<void>
  initialDate?: Date
  initialStartTime?: string // "HH:MM" format from calendar click
}

export function ShiftForm({ open, onClose, onSubmit, initialDate, initialStartTime }: ShiftFormProps) {
  const t = useTranslations('slotForm')
  const tc = useTranslations('common')

  const [date, setDate] = useState(() => formatDateLocal(initialDate ?? new Date()))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDate(formatDateLocal(initialDate ?? new Date()))
      // Use clicked time or default to 09:00-10:00
      const start = initialStartTime || '09:00'
      setStartTime(start)
      // Auto-set end time to 1 hour after start
      const [h, m] = start.split(':').map(Number)
      const endH = Math.min(h + 1, 23)
      setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      setRecurrence('none')
      setError(null)
    }
  }, [open, initialDate, initialStartTime])

  const handleSubmit = async () => {
    setError(null)
    if (!date || !startTime || !endTime) {
      setError(t('errorAllFields'))
      return
    }

    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    if (endDateTime <= startDateTime) {
      setError(t('errorEndAfterStart'))
      return
    }

    let rruleStr: string | undefined
    if (recurrence !== 'none') {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: recurrence === 'biweekly' ? 2 : 1,
        dtstart: startDateTime,
        count: recurrence === 'biweekly' ? 14 : 28,
      })
      rruleStr = rule.toString()
    }

    setSubmitting(true)
    try {
      await onSubmit({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        rrule: rruleStr,
      })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="shift-date">{t('dateLabel')}</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift-start">{t('startTimeLabel')}</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-end">{t('endTimeLabel')}</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('recurrenceLabel')}</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('recurrenceNone')}</SelectItem>
                <SelectItem value="weekly">{t('recurrenceWeekly')}</SelectItem>
                <SelectItem value="biweekly">{t('recurrenceBiweekly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{tc('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? tc('creating') : t('submitButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
