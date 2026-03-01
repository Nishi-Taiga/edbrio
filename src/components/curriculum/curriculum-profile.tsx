'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2, Check, X } from 'lucide-react'
import { StudentProfile } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface CurriculumProfileProps {
  profile: StudentProfile
  onUpdate: (id: string, updates: Partial<StudentProfile>) => Promise<void>
}

export function CurriculumProfile({ profile, onUpdate }: CurriculumProfileProps) {
  const t = useTranslations('curriculum.profile')
  const tc = useTranslations('common')
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
            <CardTitle>{t('title')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-1" />{tc('edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">{t('name')}</dt><dd className="font-medium">{profile.name}</dd></div>
            <div><dt className="text-gray-500">{t('grade')}</dt><dd>{profile.grade || t('notSet')}</dd></div>
            <div><dt className="text-gray-500">{t('school')}</dt><dd>{profile.school || t('notSet')}</dd></div>
            <div><dt className="text-gray-500">{t('birthDate')}</dt><dd>{profile.birth_date || t('notSet')}</dd></div>
            <div className="col-span-2">
              <dt className="text-gray-500">{t('subjects')}</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {profile.subjects && profile.subjects.length > 0
                  ? profile.subjects.map(s => (
                    <span key={s} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded px-2 py-0.5">{s}</span>
                  ))
                  : <span className="text-gray-400">{t('notSet')}</span>
                }
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">{t('personality')}</dt>
              <dd className="whitespace-pre-wrap">{profile.personality_notes || t('notSet')}</dd>
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
          <CardTitle>{t('editTitle')}</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4 mr-1" />{tc('cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="w-4 h-4 mr-1" />{saving ? tc('saving') : tc('save')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="grade">{t('grade')}</Label>
            <Input id="grade" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder={t('gradePlaceholder')} />
          </div>
          <div>
            <Label htmlFor="school">{t('school')}</Label>
            <Input id="school" value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="birth_date">{t('birthDate')}</Label>
            <Input id="birth_date" type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="subjects">{t('subjectsLabel')}</Label>
            <Input id="subjects" value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))} placeholder={t('subjectsPlaceholder')} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="personality_notes">{t('personality')}</Label>
            <textarea
              id="personality_notes"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              value={form.personality_notes}
              onChange={e => setForm(f => ({ ...f, personality_notes: e.target.value }))}
              placeholder={t('personalityPlaceholder')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
