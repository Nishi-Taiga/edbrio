"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit2, X, Sun, Moon, Monitor } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getStripe } from '@/lib/stripe'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { isInitialSetupComplete } from '@/lib/teacher-setup'
import { StationSelector } from '@/components/area/station-selector'
import type { StationSelection } from '@/lib/types/database'

type PublicProfile = {
  display_name?: string
  bio?: string
  area?: string
  service_areas?: StationSelection[]
  available_online?: boolean
  experience_years?: string
}

type TeacherRow = {
  id: string
  subjects: string[]
  grades: string[]
  plan: 'free' | 'pro'
  public_profile: PublicProfile
  stripe_account_id?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  is_onboarding_complete?: boolean
}

export default function TeacherProfilePage() {
  const tc = useTranslations('common')
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-gray-500 dark:text-slate-400">{tc('loading')}</div>}>
      <TeacherProfileContent />
    </Suspense>
  )
}

function TeacherProfileContent() {
  const t = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubjects, setEditedSubjects] = useState<string[]>([])
  const [editedGrades, setEditedGrades] = useState<string[]>([])
  const [editedProfile, setEditedProfile] = useState<PublicProfile>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)

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

  const { theme, setTheme } = useTheme()
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()

  // Show toast for subscription redirect results
  useEffect(() => {
    const status = searchParams.get('subscription')
    if (status === 'success') {
      toast.success(t('upgradeSuccess'))
    } else if (status === 'canceled') {
      toast.info(t('upgradeCanceled'))
    }
  }, [searchParams, t])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setTeacher(null); return }
        const { data, error } = await supabase
          .from('teachers')
          .select('id,subjects,grades,plan,public_profile,stripe_account_id,stripe_customer_id,stripe_subscription_id,is_onboarding_complete')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (mounted) {
          const profile = (data?.public_profile || {}) as PublicProfile
          setTeacher(data)
          setEditedSubjects(data?.subjects || [])
          setEditedGrades(data?.grades || [])
          setEditedProfile(profile)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
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
      setIsEditing(false)
      toast.success(t('saveSuccess'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpgrade = async () => {
    setIsSubscriptionLoading(true)
    try {
      const res = await fetch('/api/checkout/subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const stripeClient = await getStripe()
      if (stripeClient) {
        await stripeClient.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      setError(err instanceof Error ? err.message : t('upgradeError'))
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsSubscriptionLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      console.error('Portal error:', err)
      setError(err instanceof Error ? err.message : t('portalError'))
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-500 dark:text-slate-400">{tc('loading')}</div>
        ) : !teacher ? (
          <div className="text-gray-500 dark:text-slate-400">{t('profileNotFound')}</div>
        ) : isEditing ? (
          /* -- Edit Mode -- */
          <Card>
            <CardHeader>
              <CardTitle>{t('profileEditTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <label className="block text-sm font-medium mb-2">{t('areaLabel')}</label>
                  <StationSelector
                    selectedStations={editedProfile.service_areas || []}
                    onStationsChange={(stations) => setEditedProfile(p => ({ ...p, service_areas: stations }))}
                    availableOnline={editedProfile.available_online || false}
                    onAvailableOnlineChange={(v) => setEditedProfile(p => ({ ...p, available_online: v }))}
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

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>{tc('cancel')}</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? tc('saving') : <><Check className="w-4 h-4 mr-1" /> {tc('save')}</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* -- View Mode -- */
          <>
            {/* Profile */}
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
                <div className="text-sm text-gray-700 dark:text-slate-300 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">{t('displayNameLabel')}</span>
                      {teacher.public_profile?.display_name || <span className="text-gray-400">{tc('notSet')}</span>}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">{t('bioLabel')}</span>
                      {teacher.public_profile?.bio ? (
                        <p className="whitespace-pre-wrap">{teacher.public_profile.bio}</p>
                      ) : (
                        <span className="text-gray-400">{tc('notSet')}</span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('areaLabel')}</span>
                      {(teacher.public_profile?.service_areas?.length || teacher.public_profile?.available_online) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.public_profile?.available_online && (
                            <Badge variant="outline">{t('availableOnline')}</Badge>
                          )}
                          {(teacher.public_profile?.service_areas || []).map((s: StationSelection, i: number) => (
                            <Badge key={`${s.line}-${s.name}-${i}`} variant="secondary">
                              {s.name} <span className="text-xs text-muted-foreground ml-0.5">({s.line})</span>
                            </Badge>
                          ))}
                        </div>
                      ) : teacher.public_profile?.area ? (
                        <span>{teacher.public_profile.area}</span>
                      ) : (
                        <span className="text-gray-400">{tc('notSet')}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">{t('experienceLabel')}</span>
                      {teacher.public_profile?.experience_years || <span className="text-gray-400">{tc('notSet')}</span>}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">{t('subjectsLabel')}</span>
                      {(teacher.subjects || []).join(' / ') || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">{t('gradesLabel')}</span>
                      {(teacher.grades || []).join(' / ') || '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan / Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>{t('planTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.plan === 'pro' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/30">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-brand-600 text-white">Pro</Badge>
                        <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                          {t('standardPlanLabel')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManageSubscription}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading ? tc('loading') : t('manageSubscription')}
                      </Button>
                    </div>

                    {/* Stripe Integration - Pro plan only */}
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-2">{t('stripePaymentTitle')}</span>
                      {teacher.stripe_account_id ? (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">{t('stripeLinked')}</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-slate-400">{t('stripeNotLinked')}</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/stripe/onboard', { method: 'POST' })
                                const data = await res.json()
                                if (data.url) window.location.href = data.url
                              } catch (err) {
                                console.error('Stripe onboarding error:', err)
                              }
                            }}
                          >
                            {t('stripeLinkButton')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-surface border border-gray-200 dark:border-brand-800/20">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Free</Badge>
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        {t('freePlanFeeLabel')}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleUpgrade}
                      disabled={isSubscriptionLoading}
                    >
                      {isSubscriptionLoading ? tc('processing') : t('upgradeButton')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('themeTitle')}</CardTitle>
                <CardDescription>{t('themeDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 max-w-sm">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
                  >
                    <Sun className="w-6 h-6 text-amber-500" />
                    <span className="text-sm font-semibold">{t('themeLight')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
                  >
                    <Moon className="w-6 h-6 text-brand-500" />
                    <span className="text-sm font-semibold">{t('themeDark')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'system' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
                  >
                    <Monitor className="w-6 h-6 text-slate-500" />
                    <span className="text-sm font-semibold">{t('themeSystem')}</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Feature Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>{t('planComparisonTitle')}</CardTitle>
                <CardDescription>{t('planComparisonDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-slate-300">{t('featureColumn')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-500 dark:text-slate-400">{t('freeColumn')}</th>
                        <th className="text-center py-3 pl-4 font-semibold text-brand-600 dark:text-brand-400">{t('standardColumn')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-slate-300">
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureStudents')}</td>
                        <td className="text-center py-3 px-4">{t('featureStudentsFree')}</td>
                        <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">{t('featureStudentsStandard')}</td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureAiReports')}</td>
                        <td className="text-center py-3 px-4">{t('featureAiReportsFree')}</td>
                        <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">{t('featureAiReportsStandard')}</td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureCalendar')}</td>
                        <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureKarte')}</td>
                        <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureStripe')}</td>
                        <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureFee')}</td>
                        <td className="text-center py-3 px-4">7%</td>
                        <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">1.4%</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">{t('featurePrioritySupport')}</td>
                        <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {teacher.plan !== 'pro' && (
                  <div className="mt-6 flex justify-center">
                    <Button onClick={handleUpgrade} disabled={isSubscriptionLoading}>
                      {isSubscriptionLoading ? tc('processing') : t('upgradeButtonWithTrial')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
