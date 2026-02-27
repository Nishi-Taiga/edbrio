'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RRule } from 'rrule'

type RecurrenceType = 'none' | 'weekly' | 'biweekly'

interface ShiftFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (params: { startTime: string; endTime: string; rrule?: string }) => Promise<void>
  initialDate?: Date
}

export function ShiftForm({ open, onClose, onSubmit, initialDate }: ShiftFormProps) {
  const defaultDate = initialDate
    ? formatDateLocal(initialDate)
    : formatDateLocal(new Date())

  const [date, setDate] = useState(defaultDate)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!date || !startTime || !endTime) {
      setError('すべての項目を入力してください')
      return
    }

    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    if (endDateTime <= startDateTime) {
      setError('終了時刻は開始時刻より後にしてください')
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
          <DialogTitle>シフトを追加</DialogTitle>
          <DialogDescription>日付・時間帯・繰り返し設定を入力してください</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="shift-date">日付</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift-start">開始時刻</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-end">終了時刻</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>繰り返し</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし（単発）</SelectItem>
                <SelectItem value="weekly">毎週</SelectItem>
                <SelectItem value="biweekly">隔週</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '作成中...' : 'シフトを作成'}
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
