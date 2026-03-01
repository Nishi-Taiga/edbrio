'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { isInitialSetupComplete } from '@/lib/teacher-setup'
import { AreaSelector } from '@/components/area/area-selector'
import type { AreaSelection } from '@/lib/types/database'

type PublicProfile = {
  display_name?: string
  bio?: string
  area?: string
  service_areas?: AreaSelection[]
  available_online?: boolean
  experience_years?: string
}

/** Convert legacy StationSelection data to AreaSelection format */
function migrateServiceAreas(raw: unknown[]): AreaSelection[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const obj = item as Record<string, string>
    if ('line' in obj && 'name' in obj) {
      return { prefecture: obj.prefecture, municipality: obj.name }
    }
    return item as AreaSelection
  })
}

const TOTAL_STEPS = 3

export default function TeacherSetupPage() {
  const t = useTranslations('teacherSetup')
  const tp = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editedProfile, setEditedProfile] = useState<PublicProfile>({})
  const [editedSubjects, setEditedSubjects] = useState<string[]>([])
  const [editedGrades, setEditedGrades] = useState<string[]>([])

  const SUBJECT_OPTIONS = [
    tp('subjectOptions.japanese'), tp('subjectOptions.arithmetic'), tp('subjectOptions.math'), tp('subjectOptions.english'), tp('subjectOptions.science'), tp('subjectOptions.socialStudies'),
    tp('subjectOptions.physics'), tp('subjectOptions.chemistry'), tp('subjectOptions.biology'), tp('subjectOptions.earthScience'),
    tp('subjectOptions.japaneseHistory'), tp('subjectOptions.worldHistory'), tp('subjectOptions.geography'), tp('subjectOptions.politicsEconomics'),
    tp('subjectOptions.classicalJapanese'), tp('subjectOptions.classicalChinese'), tp('subjectOptions.essay'), tp('subjectOptions.informatics'),
  ]

  const GRADE_OPTIONS = [
    tp('gradeOptions.e1'), tp('gradeOptions.e2'), tp('gradeOptions.e3'), tp('gradeOptions.e4'), tp('gradeOptions.e5'), tp('gradeOptions.e6'),
    tp('gradeOptions.j1'), tp('gradeOptions.j2'), tp('gradeOptions.j3'),
    tp('gradeOptions.h1'), tp('gradeOptions.h2'), tp('gradeOptions.h3'),
  ]

  // Load existing data
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) return
        const { data } = await supabase
          .from('teachers')
          .select('id,subjects,grades,public_profile')
          .eq('id', uid)
          .maybeSingle()
        if (mounted && data) {
          setTeacherId(data.id)
          const profile = (data.public_profile || {}) as PublicProfile
          setEditedProfile({
            ...profile,
            service_areas: migrateServiceAreas(profile.service_areas || []),
          })
          setEditedSubjects(data.subjects || [])
          setEditedGrades(data.grades || [])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  const canProceedStep1 = (editedProfile.display_name?.trim() || '').length > 0
    && (editedProfile.bio?.trim() || '').length > 0

  const canProceedStep2 = editedSubjects.length > 0 && editedGrades.length > 0

  const handleSave = async () => {
    if (!teacherId) return
    setIsSubmitting(true)
    try {
      const setupComplete = isInitialSetupComplete(editedSubjects, editedGrades, editedProfile)

      const { error } = await supabase
        .from('teachers')
        .update({
          subjects: editedSubjects,
          grades: editedGrades,
          public_profile: editedProfile,
          is_onboarding_complete: setupComplete,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teacherId)
      if (error) throw error

      toast.success(t('setupComplete'))
      router.push('/teacher/dashboard')
    } catch {
      toast.error(tc('updateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground text-center mb-3">
            {t('stepOf', { current: step, total: TOTAL_STEPS })}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-brand-600 dark:bg-brand-400' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Step 1: Profile Info */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('step1Title')}</CardTitle>
                  <CardDescription>{t('step1Description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{tp('displayNameLabel')}</label>
                    <Input
                      value={editedProfile.display_name || ''}
                      onChange={(e) => setEditedProfile(p => ({ ...p, display_name: e.target.value }))}
                      placeholder={tp('displayNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tp('bioLabel')}</label>
                    <textarea
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder={tp('bioPlaceholder')}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                      {t('next')} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Teaching Info */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('step2Title')}</CardTitle>
                  <CardDescription>{t('step2Description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">{tp('subjectsLabel')}</label>
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
                    <label className="block text-sm font-medium mb-2">{tp('gradesLabel')}</label>
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
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                      {t('next')} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Area (optional) */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('step3Title')}</CardTitle>
                  <CardDescription>{t('step3Description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{tp('experienceLabel')}</label>
                    <Input
                      value={editedProfile.experience_years || ''}
                      onChange={(e) => setEditedProfile(p => ({ ...p, experience_years: e.target.value }))}
                      placeholder={tp('experiencePlaceholder')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={editedProfile.available_online || false}
                      onCheckedChange={(checked) => setEditedProfile(p => ({ ...p, available_online: !!checked }))}
                      id="setup-online"
                    />
                    <label htmlFor="setup-online" className="text-sm font-medium cursor-pointer">{tp('availableOnline')}</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{tp('areaLabel')}</label>
                    <AreaSelector
                      selectedAreas={editedProfile.service_areas || []}
                      onAreasChange={(areas) => setEditedProfile(p => ({ ...p, service_areas: areas }))}
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={handleSave} disabled={isSubmitting}>
                        {t('skip')}
                      </Button>
                      <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        {t('complete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
