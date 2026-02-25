'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2, Check, X } from 'lucide-react'
import { StudentProfile } from '@/lib/types/database'

interface KarteProfileProps {
  profile: StudentProfile
  onUpdate: (id: string, updates: Partial<StudentProfile>) => Promise<void>
}

export function KarteProfile({ profile, onUpdate }: KarteProfileProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: profile.name,
    grade: profile.grade || '',
    school: profile.school || '',
    birth_date: profile.birth_date || '',
    subjects: (profile.subjects || []).join(', '),
    personality_notes: profile.personality_notes || '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(profile.id, {
        name: form.name,
        grade: form.grade || undefined,
        school: form.school || undefined,
        birth_date: form.birth_date || undefined,
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
        personality_notes: form.personality_notes || undefined,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      name: profile.name,
      grade: profile.grade || '',
      school: profile.school || '',
      birth_date: profile.birth_date || '',
      subjects: (profile.subjects || []).join(', '),
      personality_notes: profile.personality_notes || '',
    })
    setEditing(false)
  }

  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>基本情報</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-1" />編集
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">名前</dt><dd className="font-medium">{profile.name}</dd></div>
            <div><dt className="text-gray-500">学年</dt><dd>{profile.grade || '未設定'}</dd></div>
            <div><dt className="text-gray-500">学校</dt><dd>{profile.school || '未設定'}</dd></div>
            <div><dt className="text-gray-500">生年月日</dt><dd>{profile.birth_date || '未設定'}</dd></div>
            <div className="col-span-2">
              <dt className="text-gray-500">受講科目</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {profile.subjects && profile.subjects.length > 0
                  ? profile.subjects.map(s => (
                    <span key={s} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded px-2 py-0.5">{s}</span>
                  ))
                  : <span className="text-gray-400">未設定</span>
                }
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">性格・学習スタイル</dt>
              <dd className="whitespace-pre-wrap">{profile.personality_notes || '未設定'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>基本情報を編集</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4 mr-1" />キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="w-4 h-4 mr-1" />{saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">名前</Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="grade">学年</Label>
            <Input id="grade" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="例: 中学2年" />
          </div>
          <div>
            <Label htmlFor="school">学校</Label>
            <Input id="school" value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="birth_date">生年月日</Label>
            <Input id="birth_date" type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="subjects">受講科目（カンマ区切り）</Label>
            <Input id="subjects" value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))} placeholder="例: 数学, 英語, 国語" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="personality_notes">性格・学習スタイル</Label>
            <textarea
              id="personality_notes"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={form.personality_notes}
              onChange={e => setForm(f => ({ ...f, personality_notes: e.target.value }))}
              placeholder="例: 集中力が高い。視覚的な教材を好む。"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
