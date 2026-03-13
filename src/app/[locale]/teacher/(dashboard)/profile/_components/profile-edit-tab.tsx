'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit2, Camera } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { isInitialSetupComplete } from '@/lib/teacher-setup'
import { AreaSelector } from '@/components/area/area-selector'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AreaSelection } from '@/lib/types/database'
import type { PublicProfile, TeacherRow } from './types'
import { migrateServiceAreas } from './types'

interface ProfileEditTabProps {
  teacher: TeacherRow
  editedSubjects: string[]
  setEditedSubjects: React.Dispatch<React.SetStateAction<string[]>>
  editedGrades: string[]
  setEditedGrades: React.Dispatch<React.SetStateAction<string[]>>
  editedProfile: PublicProfile
  setEditedProfile: React.Dispatch<React.SetStateAction<PublicProfile>>
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  setTeacher: React.Dispatch<React.SetStateAction<TeacherRow | null>>
  setError: (error: string | null) => void
  supabase: SupabaseClient
}

export function ProfileEditTab({
  teacher,
  editedSubjects,
  setEditedSubjects,
  editedGrades,
  setEditedGrades,
  editedProfile,
  setEditedProfile,
  isEditing,
  setIsEditing,
  setTeacher,
  setError,
  supabase,
}: ProfileEditTabProps) {
  const t = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const { dbUser, refreshDbUser } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const SUBJECT_OPTIONS = [
    t('subjectOptions.japanese'), t('subjectOptions.arithmetic'), t('subjectOptions.math'), t('subjectOptions.english'), t('subjectOptions.science'), t('subjectOptions.socialStudies'),
    t('subjectOptions.physics'), t('subjectOptions.chemistry'), t('subjectOptions.biology'), t('subjectOptions.earthScience'),
    t('subjectOptions.japaneseHistory'), t('subjectOptions.worldHistory'), t('subjectOptions.geography'), t('subjectOptions.politicsEconomics'),
    t('subjectOptions.classicalJapanese'), t('subjectOptions.classicalChinese'), t('subjectOptions.essay'), t('subjectOptions.informatics'),
  ]

  const GRADE_OPTIONS = [
    t('gradeOptions.e1'), t('gradeOptions.e2'), t('gradeOptions.e3'), t('gradeOptions.e4'), t('gradeOptions.e5'), t('gradeOptions.e6'),
    t('gradeOptions.j1'), t('gradeOptions.j2'), t('gradeOptions.j3'),
    t('gradeOptions.h1'), t('gradeOptions.h2'), t('gradeOptions.h3'),
  ]

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('avatarTooLarge'))
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('avatarInvalidFormat'))
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setIsSubmitting(true)
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${teacher.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { contentType: avatarFile.type })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path)

        const { error: avatarDbErr } = await supabase
          .from('users')
          .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq('id', teacher.id)
        if (avatarDbErr) throw avatarDbErr
      }

      const setupComplete = isInitialSetupComplete(editedSubjects, editedGrades, editedProfile)

      const { error } = await supabase
        .from('teachers')
        .update({
          subjects: editedSubjects,
          grades: editedGrades,
          public_profile: editedProfile,
          is_onboarding_complete: setupComplete,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.id)
      if (error) throw error

      setTeacher({
        ...teacher,
        subjects: editedSubjects,
        grades: editedGrades,
        public_profile: editedProfile,
        is_onboarding_complete: setupComplete,
      })
      if (avatarFile) {
        setAvatarFile(null)
        setAvatarPreview(null)
        refreshDbUser()
      }
      setIsEditing(false)
      toast.success(t('saveSuccess'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('profileEditTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>{tc('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tc('saving') : <><Check className="w-4 h-4 mr-1" /> {tc('save')}</>}
              </Button>
            </div>

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2">
              <label className="block text-sm font-medium">{t('avatarLabel')}</label>
              <div className="relative group cursor-pointer">
                <Avatar className="w-24 h-24">
                  {(avatarPreview || dbUser?.avatar_url) && (
                    <AvatarImage src={avatarPreview || dbUser?.avatar_url} alt={t('avatarAlt')} />
                  )}
                  <AvatarFallback className="text-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {editedProfile.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleAvatarChange}
                />
              </div>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                >
                  {tc('cancel')}
                </Button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('displayNameLabel')}</label>
              <Input
                value={editedProfile.display_name || ''}
                onChange={(e) => setEditedProfile(p => ({ ...p, display_name: e.target.value }))}
                placeholder={t('displayNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('bioLabel')}</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
                value={editedProfile.bio || ''}
                onChange={(e) => setEditedProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder={t('bioPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('experienceLabel')}</label>
              <Input
                value={editedProfile.experience_years || ''}
                onChange={(e) => setEditedProfile(p => ({ ...p, experience_years: e.target.value }))}
                placeholder={t('experiencePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('subjectsLabel')}</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {SUBJECT_OPTIONS.map((subject) => (
                  <label key={subject} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={editedSubjects.includes(subject)}
                      onCheckedChange={(checked) => {
                        setEditedSubjects(prev =>
                          checked ? [...prev, subject] : prev.filter(s => s !== subject)
                        )
                      }}
                    />
                    {subject}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('gradesLabel')}</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {GRADE_OPTIONS.map((grade) => (
                  <label key={grade} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={editedGrades.includes(grade)}
                      onCheckedChange={(checked) => {
                        setEditedGrades(prev =>
                          checked ? [...prev, grade] : prev.filter(g => g !== grade)
                        )
                      }}
                    />
                    {grade}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={editedProfile.available_online || false}
                onCheckedChange={(checked) => setEditedProfile(p => ({ ...p, available_online: !!checked }))}
                id="available-online"
              />
              <label htmlFor="available-online" className="text-sm font-medium cursor-pointer">{t('availableOnline')}</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('areaLabel')}</label>
              <AreaSelector
                selectedAreas={editedProfile.service_areas || []}
                onAreasChange={(areas) => setEditedProfile(p => ({ ...p, service_areas: areas }))}
              />
            </div>

          </form>
        </CardContent>
      </Card>
    )
  }

  // View mode
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('profileTitle')}</CardTitle>
          <CardDescription>{t('profileDescription')}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4 mr-2" /> {tc('edit')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
          <Avatar className="w-24 h-24">
            {dbUser?.avatar_url && <AvatarImage src={dbUser.avatar_url} alt={t('avatarAlt')} />}
            <AvatarFallback className="text-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {teacher.public_profile?.display_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-gray-700 dark:text-slate-300 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('displayNameLabel')}</span>
              <span className="text-base">{teacher.public_profile?.display_name || <span className="text-gray-400 text-sm">{tc('notSet')}</span>}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('bioLabel')}</span>
              {teacher.public_profile?.bio ? (
                <p className="text-base whitespace-pre-wrap leading-relaxed">{teacher.public_profile.bio}</p>
              ) : (
                <span className="text-gray-400 text-sm">{tc('notSet')}</span>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('experienceLabel')}</span>
              <span className="text-base">{teacher.public_profile?.experience_years || <span className="text-gray-400 text-sm">{tc('notSet')}</span>}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('subjectsLabel')}</span>
              <span className="text-sm">{(teacher.subjects || []).join(' / ') || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('gradesLabel')}</span>
              <span className="text-sm">{(teacher.grades || []).join(' / ') || '-'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('availableOnline')}</span>
              {teacher.public_profile?.available_online ? (
                <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">{t('onlineAvailable')}</Badge>
              ) : (
                <Badge variant="outline" className="border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400">{t('onlineUnavailable')}</Badge>
              )}
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('areaLabel')}</span>
              {migrateServiceAreas(teacher.public_profile?.service_areas || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {migrateServiceAreas(teacher.public_profile?.service_areas || []).map((a: AreaSelection, i: number) => (
                    <Badge key={`${a.prefecture}-${a.municipality}-${i}`} variant="secondary">
                      {a.municipality} <span className="text-xs text-muted-foreground ml-0.5">({a.prefecture})</span>
                    </Badge>
                  ))}
                </div>
              ) : teacher.public_profile?.area ? (
                <span className="text-sm">{teacher.public_profile.area}</span>
              ) : (
                <span className="text-gray-400 text-sm">{tc('notSet')}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
