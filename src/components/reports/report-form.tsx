'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from 'next-intl'

interface ReportFormData {
  subject: string
  contentRaw: string
  comprehensionLevel: number
  studentMood: string
  homework: string
  nextPlan: string
  maxLength: number
}

interface ReportFormProps {
  data: ReportFormData
  onChange: (data: ReportFormData) => void
}

export function ReportForm({ data, onChange }: ReportFormProps) {
  const t = useTranslations('reportForm')
  const update = (key: keyof ReportFormData, value: string | number) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rf-subject">{t('subjectLabel')}</Label>
        <Input id="rf-subject" value={data.subject} onChange={e => update('subject', e.target.value)} placeholder={t('subjectPlaceholder')} />
      </div>

      <div>
        <Label htmlFor="rf-content">{t('contentLabel')}</Label>
        <textarea
          id="rf-content"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
          value={data.contentRaw}
          onChange={e => update('contentRaw', e.target.value)}
          placeholder={t('contentPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t('comprehensionLabel')}</Label>
          <Select value={String(data.comprehensionLevel)} onValueChange={v => update('comprehensionLevel', Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('comprehension1')}</SelectItem>
              <SelectItem value="2">{t('comprehension2')}</SelectItem>
              <SelectItem value="3">{t('comprehension3')}</SelectItem>
              <SelectItem value="4">{t('comprehension4')}</SelectItem>
              <SelectItem value="5">{t('comprehension5')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('moodLabel')}</Label>
          <Select value={data.studentMood} onValueChange={v => update('studentMood', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="good">{t('moodGood')}</SelectItem>
              <SelectItem value="neutral">{t('moodNeutral')}</SelectItem>
              <SelectItem value="tired">{t('moodTired')}</SelectItem>
              <SelectItem value="unmotivated">{t('moodUnmotivated')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="rf-homework">{t('homeworkLabel')}</Label>
        <Input id="rf-homework" value={data.homework} onChange={e => update('homework', e.target.value)} placeholder={t('homeworkPlaceholder')} />
      </div>

      <div>
        <Label htmlFor="rf-next">{t('nextPlanLabel')}</Label>
        <Input id="rf-next" value={data.nextPlan} onChange={e => update('nextPlan', e.target.value)} placeholder={t('nextPlanPlaceholder')} />
      </div>

      <div>
        <Label htmlFor="rf-maxlength">{t('maxLengthLabel')}</Label>
        <Input
          id="rf-maxlength"
          type="number"
          min={100}
          max={2000}
          step={100}
          value={data.maxLength}
          onChange={e => update('maxLength', Number(e.target.value))}
          placeholder={t('maxLengthPlaceholder')}
        />
      </div>
    </div>
  )
}
