"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit2, X, Sun, Moon, Monitor, Mail, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getStripe } from '@/lib/stripe'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { isInitialSetupComplete } from '@/lib/teacher-setup'
import { AreaSelector } from '@/components/area/area-selector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { AreaSelection } from '@/lib/types/database'
import type { StudentProfile } from '@/lib/types/database'

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
  const tInvite = useTranslations('invite')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubjects, setEditedSubjects] = useState<string[]>([])
  const [editedGrades, setEditedGrades] = useState<string[]>([])
  const [editedProfile, setEditedProfile] = useState<PublicProfile>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)

  // Invite parent state
  const [profiles, setProfiles] = useState<StudentProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, { email: string; used: boolean; accepted_at?: string }>>({})
  const [inviteStatusLoading, setInviteStatusLoading] = useState(false)

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
          const migratedProfile = {
            ...profile,
            service_areas: migrateServiceAreas(profile.service_areas || []),
          }
          setTeacher(data)
          setEditedSubjects(data?.subjects || [])
          setEditedGrades(data?.grades || [])
          setEditedProfile(migratedProfile)
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

  // Load student profiles and invite statuses
  useEffect(() => {
    let mounted = true
    async function loadProfiles() {
      try {
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) return

        const { data: profileData } = await supabase
          .from('student_profiles')
          .select('id, name, grade, status')
          .eq('teacher_id', uid)
          .eq('status', 'active')
          .order('name')
        if (mounted && profileData) setProfiles(profileData as StudentProfile[])

        // Load invite statuses
        setInviteStatusLoading(true)
        const { data: inviteData } = await supabase
          .from('invites')
          .select('student_profile_id, email, used, accepted_at')
          .order('created_at', { ascending: false })
        if (mounted && inviteData) {
          const statusMap: Record<string, { email: string; used: boolean; accepted_at?: string }> = {}
          for (const inv of inviteData) {
            if (inv.student_profile_id && !statusMap[inv.student_profile_id]) {
              statusMap[inv.student_profile_id] = { email: inv.email, used: inv.used, accepted_at: inv.accepted_at }
            }
          }
          setInviteStatuses(statusMap)
        }
      } catch {
        // Ignore - non-critical
      } finally {
        if (mounted) setInviteStatusLoading(false)
      }
    }
    loadProfiles()
    return () => { mounted = false }
  }, [supabase])

  const handleInvite = async () => {
    if (!selectedProfileId || !inviteEmail.trim()) return
    setInviteSending(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), studentProfileId: selectedProfileId }),
      })
      if (res.status === 409) {
        toast.error(tInvite('inviteAlreadySent'))
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || tInvite('inviteError'))
        return
      }
      toast.success(tInvite('inviteSent'))
      setInviteStatuses(prev => ({
        ...prev,
        [selectedProfileId]: { email: inviteEmail.trim(), used: false },
      }))
      setInviteEmail('')
      setSelectedProfileId('')
    } catch {
      toast.error(tInvite('inviteError'))
    } finally {
      setInviteSending(false)
    }
  }

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
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>{tc('cancel')}</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? tc('saving') : <><Check className="w-4 h-4 mr-1" /> {tc('save')}</>}
                  </Button>
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

                <div>
                  <label className="block text-sm font-medium mb-2">{t('areaLabel')}</label>
                  <AreaSelector
                    selectedAreas={editedProfile.service_areas || []}
                    onAreasChange={(areas) => setEditedProfile(p => ({ ...p, service_areas: areas }))}
                    availableOnline={editedProfile.available_online || false}
                    onAvailableOnlineChange={(v) => setEditedProfile(p => ({ ...p, available_online: v }))}
                  />
                </div>

              </form>
            </CardContent>
          </Card>
        ) : (
          /* -- View Mode -- */
          <>
            {/* Invite Parent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {tInvite('inviteParent')}
                </CardTitle>
                <CardDescription>{tInvite('inviteParentSettingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">{tInvite('selectStudent')}</Label>
                    <Select value={selectedProfileId} onValueChange={(v) => {
                      setSelectedProfileId(v)
                      // Show existing invite email if any
                      const existing = inviteStatuses[v]
                      if (existing && !existing.accepted_at) {
                        setInviteEmail(existing.email || '')
                      } else {
                        setInviteEmail('')
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={tInvite('selectStudentPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              {p.name}
                              {p.grade && <span className="text-xs text-muted-foreground">({p.grade})</span>}
                              {inviteStatuses[p.id]?.accepted_at && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                              {inviteStatuses[p.id] && !inviteStatuses[p.id].used && !inviteStatuses[p.id].accepted_at && <Clock className="w-3 h-3 text-amber-500" />}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">{tInvite('emailLabel')}</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={tInvite('emailPlaceholder')}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleInvite} disabled={inviteSending || !selectedProfileId || !inviteEmail.trim()}>
                      {inviteSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
                      {inviteSending ? tc('processing') : tInvite('sendInvite')}
                    </Button>
                  </div>
                </div>

                {selectedProfileId && inviteStatuses[selectedProfileId] && (
                  <div className={`mt-3 flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                    inviteStatuses[selectedProfileId].accepted_at
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {inviteStatuses[selectedProfileId].accepted_at ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                        <span className="text-green-700 dark:text-green-300">{tInvite('inviteAccepted')}: {inviteStatuses[selectedProfileId].email}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-amber-700 dark:text-amber-300">{tInvite('invitePending')}: {inviteStatuses[selectedProfileId].email}</span>
                      </>
                    )}
                  </div>
                )}

                {profiles.length === 0 && !inviteStatusLoading && (
                  <p className="mt-3 text-sm text-muted-foreground">{tInvite('noStudents')}</p>
                )}
              </CardContent>
            </Card>

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
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">{t('areaLabel')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.public_profile?.available_online ? (
                          <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">{t('onlineAvailable')}</Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400">{t('onlineUnavailable')}</Badge>
                        )}
                        {migrateServiceAreas(teacher.public_profile?.service_areas || []).map((a: AreaSelection, i: number) => (
                          <Badge key={`${a.prefecture}-${a.municipality}-${i}`} variant="secondary">
                            {a.municipality} <span className="text-xs text-muted-foreground ml-0.5">({a.prefecture})</span>
                          </Badge>
                        ))}
                        {!teacher.public_profile?.service_areas?.length && teacher.public_profile?.area && (
                          <span className="text-sm">{teacher.public_profile.area}</span>
                        )}
                      </div>
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
