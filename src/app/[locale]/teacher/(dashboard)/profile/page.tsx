"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit2, X, Sun, Moon, Monitor, Mail, Bell, Loader2, Clock, CheckCircle2, QrCode, CreditCard, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getStripe } from '@/lib/stripe'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { isInitialSetupComplete } from '@/lib/teacher-setup'
import { AreaSelector } from '@/components/area/area-selector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import type { AreaSelection } from '@/lib/types/database'
import type { Invite } from '@/lib/types/database'
import type { NotificationPreferences } from '@/lib/types/database'

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
  plan: 'free' | 'standard'
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
  const tNotif = useTranslations('notificationSettings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubjects, setEditedSubjects] = useState<string[]>([])
  const [editedGrades, setEditedGrades] = useState<string[]>([])
  const [editedProfile, setEditedProfile] = useState<PublicProfile>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [isStripeOnboarding, setIsStripeOnboarding] = useState(false)
  const [showStripeHelpModal, setShowStripeHelpModal] = useState(false)

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({})
  const [notifSaving, setNotifSaving] = useState(false)

  // Invite parent state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<'email' | 'qr'>('email')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [inviteList, setInviteList] = useState<Pick<Invite, 'id' | 'email' | 'method' | 'used' | 'accepted_at' | 'created_at'>[]>([])
  const [inviteListLoading, setInviteListLoading] = useState(false)

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

  // Show toast for subscription / stripe redirect results
  useEffect(() => {
    const status = searchParams.get('subscription')
    if (status === 'success') {
      toast.success(t('upgradeSuccess'))
    } else if (status === 'canceled') {
      toast.info(t('upgradeCanceled'))
    }
    const stripeStatus = searchParams.get('stripe')
    if (stripeStatus === 'success') {
      toast.success(t('stripeConnectSuccess'))
    } else if (stripeStatus === 'refresh') {
      toast.info(t('stripeConnectRefresh'))
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

  // Load invite history
  useEffect(() => {
    let mounted = true
    async function loadInvites() {
      setInviteListLoading(true)
      try {
        const { data } = await supabase
          .from('invites')
          .select('id, email, method, used, accepted_at, created_at')
          .order('created_at', { ascending: false })
          .limit(20)
        if (mounted && data) setInviteList(data)
      } catch {
        // Ignore - non-critical
      } finally {
        if (mounted) setInviteListLoading(false)
      }
    }
    loadInvites()
    return () => { mounted = false }
  }, [supabase])

  // Load notification preferences
  useEffect(() => {
    let mounted = true
    async function loadPrefs() {
      try {
        const res = await fetch('/api/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setNotifPrefs(data.preferences || {})
        }
      } catch {
        // Ignore - non-critical
      }
    }
    loadPrefs()
    return () => { mounted = false }
  }, [])

  const handleNotifToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value }
    setNotifPrefs(updated)
    setNotifSaving(true)
    try {
      const res = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        toast.success(tNotif('saveSuccess'))
      }
    } catch {
      // Revert on error
      setNotifPrefs(notifPrefs)
    } finally {
      setNotifSaving(false)
    }
  }

  const handleInvite = async () => {
    if (inviteMethod === 'email' && !inviteEmail.trim()) return
    setInviteSending(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: inviteMethod,
          ...(inviteMethod === 'email' ? { email: inviteEmail.trim() } : {}),
        }),
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
      const data = await res.json()

      if (inviteMethod === 'email') {
        toast.success(tInvite('inviteSent'))
        setInviteList(prev => [{ id: data.token, email: inviteEmail.trim(), method: 'email', used: false, created_at: new Date().toISOString() }, ...prev])
        setInviteEmail('')
      } else {
        // QR method — generate QR code on client
        const QRCode = (await import('qrcode')).default
        const appUrl = window.location.origin
        const inviteUrl = `${appUrl}/invite/${data.token}`
        const dataUrl = await QRCode.toDataURL(inviteUrl, { width: 256, margin: 2 })
        setQrDataUrl(dataUrl)
        setInviteList(prev => [{ id: data.token, method: 'qr', used: false, created_at: new Date().toISOString() }, ...prev])
      }
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

  const handleStripeOnboard = async () => {
    setIsStripeOnboarding(true)
    try {
      const res = await fetch('/api/stripe/onboard', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        console.error('Stripe onboard error:', data.error)
        toast.error(data.error || t('stripeConnectRefresh'))
        return
      }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Stripe onboarding error:', err)
      toast.error(t('stripeConnectRefresh'))
    } finally {
      setIsStripeOnboarding(false)
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
                <Tabs value={inviteMethod} onValueChange={(v) => {
                  setInviteMethod(v as 'email' | 'qr')
                  setQrDataUrl(null)
                }}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="email" className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {tInvite('emailTab')}
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      {tInvite('qrTab')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email">
                    <div className="flex flex-col sm:flex-row gap-3">
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
                        <Button onClick={handleInvite} disabled={inviteSending || !inviteEmail.trim()}>
                          {inviteSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
                          {inviteSending ? tc('processing') : tInvite('sendInvite')}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="qr">
                    {qrDataUrl ? (
                      <div className="flex flex-col items-center gap-4">
                        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 rounded-lg border" />
                        <p className="text-sm text-muted-foreground">{tInvite('qrScanInstruction')}</p>
                        <p className="text-xs text-muted-foreground">{tInvite('qrExpires')}</p>
                        <Button variant="outline" onClick={() => setQrDataUrl(null)}>
                          {tInvite('qrGenerateNew')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-4">
                        <QrCode className="w-12 h-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">{tInvite('qrDescription')}</p>
                        <Button onClick={handleInvite} disabled={inviteSending}>
                          {inviteSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                          {tInvite('qrGenerate')}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Invite history */}
                {inviteList.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">{tInvite('inviteHistory')}</h4>
                    <div className="space-y-2">
                      {inviteList.map((inv) => (
                        <div key={inv.id} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                          inv.accepted_at
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {inv.accepted_at ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          )}
                          <span className={inv.accepted_at
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-amber-700 dark:text-amber-300'
                          }>
                            {inv.email || tInvite('qrInvite')}
                            {' - '}
                            {inv.accepted_at ? tInvite('inviteAccepted') : tInvite('invitePending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
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

            {/* Stripe Connect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('stripeConnectTitle')}
                </CardTitle>
                <CardDescription>{t('stripeConnectDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {teacher.stripe_account_id ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      {t('stripeStatusConnected')}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        {t('stripeStatusNotConnected')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleStripeOnboard} disabled={isStripeOnboarding}>
                        {isStripeOnboarding ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> {t('stripeModalConnecting')}</>
                        ) : (
                          <><CreditCard className="w-4 h-4 mr-1" /> {t('stripeConnectButton')}</>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowStripeHelpModal(true)}>
                        {t('stripeHowToConnect')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan / Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>{t('planTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.plan === 'standard' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/30">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-brand-600 text-white">Standard</Badge>
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

            {/* Email Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {tNotif('title')}
                </CardTitle>
                <CardDescription>{tNotif('description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {([
                    'booking_confirmation',
                    'booking_cancellation',
                    'new_chat_message',
                    'booking_reminder',
                  ] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{tNotif(key)}</p>
                        <p className="text-xs text-muted-foreground">{tNotif(`${key}Desc`)}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[key] !== false}
                        onCheckedChange={(checked) => handleNotifToggle(key, checked)}
                        disabled={notifSaving}
                      />
                    </div>
                  ))}
                </div>
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
                        <td className="py-3 pr-4">{t('featureStripe')}</td>
                        <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureFee')}</td>
                        <td className="text-center py-3 px-4">10.6%</td>
                        <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">5%</td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureKarte')}</td>
                        <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-3 pr-4">{t('featureChat')}</td>
                        <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">{t('featurePrioritySupport')}</td>
                        <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                        <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {teacher.plan !== 'standard' && (
                  <div className="mt-6 flex justify-center">
                    <Button onClick={handleUpgrade} disabled={isSubscriptionLoading}>
                      {isSubscriptionLoading ? tc('processing') : t('upgradeButtonWithTrial')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stripe Connect Help Modal */}
            <Dialog open={showStripeHelpModal} onOpenChange={setShowStripeHelpModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('stripeModalTitle')}</DialogTitle>
                  <DialogDescription>{t('stripeModalDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('stripeModalStep1Title')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('stripeModalStep2Title')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep2Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('stripeModalStep3Title')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep3Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('stripeModalStep4Title')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep4Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">5</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('stripeModalStep5Title')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep5Desc')}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">{t('stripeModalNote')}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStripeHelpModal(false)}>
                    {tc('close')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
