'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ReportFormData {
  subject: string
  contentRaw: string
  comprehensionLevel: number
  studentMood: string
  homework: string
  nextPlan: string
}

interface ReportFormProps {
  data: ReportFormData
  onChange: (data: ReportFormData) => void
}

export function ReportForm({ data, onChange }: ReportFormProps) {
  const update = (key: keyof ReportFormData, value: string | number) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rf-subject">教科</Label>
        <Input id="rf-subject" value={data.subject} onChange={e => update('subject', e.target.value)} placeholder="例: 数学" />
      </div>

      <div>
        <Label htmlFor="rf-content">授業メモ *</Label>
        <textarea
          id="rf-content"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
          value={data.contentRaw}
          onChange={e => update('contentRaw', e.target.value)}
          placeholder="今日の授業内容、生徒の反応、気づいた点などを自由に記入..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>理解度</Label>
          <Select value={String(data.comprehensionLevel)} onValueChange={v => update('comprehensionLevel', Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - 理解不足</SelectItem>
              <SelectItem value="2">2 - やや不足</SelectItem>
              <SelectItem value="3">3 - 普通</SelectItem>
              <SelectItem value="4">4 - よく理解</SelectItem>
              <SelectItem value="5">5 - 完全理解</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>生徒の様子</Label>
          <Select value={data.studentMood} onValueChange={v => update('studentMood', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="good">集中して取り組んでいた</SelectItem>
              <SelectItem value="neutral">普通</SelectItem>
              <SelectItem value="tired">疲れている様子</SelectItem>
              <SelectItem value="unmotivated">やる気が低め</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="rf-homework">宿題</Label>
        <Input id="rf-homework" value={data.homework} onChange={e => update('homework', e.target.value)} placeholder="例: テキストP.42-45の演習問題" />
      </div>

      <div>
        <Label htmlFor="rf-next">次回の予定</Label>
        <Input id="rf-next" value={data.nextPlan} onChange={e => update('nextPlan', e.target.value)} placeholder="例: 二次方程式の応用問題に挑戦" />
      </div>
    </div>
  )
}
