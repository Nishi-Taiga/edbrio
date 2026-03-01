"use client"

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Save, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentKarte } from '@/hooks/use-student-karte'
import { useAiReport } from '@/hooks/use-ai-report'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ReportForm } from '@/components/reports/report-form'
import { AiGenerateButton } from '@/components/reports/ai-generate-button'
import { ReportPreview } from '@/components/reports/report-preview'
import { ErrorAlert } from '@/components/ui/error-alert'
import { LoadingButton } from '@/components/ui/loading-button'
import { useTranslations } from 'next-intl'
import type { TeacherPlan } from '@/lib/types/database'

interface UnreportedBooking {
  id: string
  start_time: string
  end_time: string
  student_id: string
  status: string
  profileId: string
  studentName: string
}

export default function NewReportPage() {
  const tc = useTranslations('common')
  return (
    <Suspense fallback={
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8"><div className="text-gray-500 dark:text-slate-400">{tc('loading')}</div></div>
      </ProtectedRoute>
    }>
      <NewReportContent />
    </Suspense>
  )
}

function NewReportContent() {
  const t = useTranslations('teacherReportNew')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedBookingId = searchParams.get('bookingId')
  const { user, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [unreportedBookings, setUnreportedBookings] = useState<UnreportedBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [selectedBookingId, setSelectedBookingId] = useState(preselectedBookingId || '')

  const selectedBooking = unreportedBookings.find(b => b.id === selectedBookingId)
  const selectedProfileId = selectedBooking?.profileId || ''
  const { goals, weakPoints } = useStudentKarte(selectedProfileId || undefined)
  const {
    generateReport, generatedContent, loading: aiLoading, error: aiError,
    canGenerate, remainingGenerations, maxGenerations,
  } = useAiReport()

  const [formData, setFormData] = useState({
    subject: '',
    contentRaw: '',
    comprehensionLevel: 3,
    studentMood: 'neutral',
    homework: '',
    nextPlan: '',
    maxLength: 500,
  })

  const [editedPublic, setEditedPublic] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [teacherPlan, setTeacherPlan] = useState<TeacherPlan>('free')

  // Fetch unreported bookings
  const fetchUnreportedBookings = useCallback(async () => {
    if (!user?.id) return
    setBookingsLoading(true)
    try {
      // Get all confirmed/done bookings for this teacher
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, student_id, status')
        .eq('teacher_id', user.id)
        .in('status', ['confirmed', 'done'])
        .order('start_time', { ascending: false })

      if (!bookings || bookings.length === 0) {
        setUnreportedBookings([])
        return
      }

      // Get booking_ids that already have reports
      const { data: reports } = await supabase
        .from('reports')
        .select('booking_id')
        .eq('teacher_id', user.id)
        .not('booking_id', 'is', null)

      const reportedBookingIds = new Set((reports || []).map(r => r.booking_id))

      // Get student profiles for this teacher (to map student_id → profile)
      const { data: profiles } = await supabase
        .from('student_profiles')
        .select('id, student_id, name')
        .eq('teacher_id', user.id)

      const profileMap = new Map<string, { id: string; name: string }>()
      for (const p of profiles || []) {
        if (p.student_id) profileMap.set(p.student_id, { id: p.id, name: p.name })
      }

      // Filter: unreported bookings that have a matching student profile
      const unreported = bookings
        .filter(b => !reportedBookingIds.has(b.id))
        .map(b => {
          const profile = profileMap.get(b.student_id)
          if (!profile) return null
          return {
            id: b.id,
            start_time: b.start_time,
            end_time: b.end_time,
            student_id: b.student_id,
            status: b.status,
            profileId: profile.id,
            studentName: profile.name,
          } satisfies UnreportedBooking
        })
        .filter((b): b is UnreportedBooking => b !== null)

      setUnreportedBookings(unreported)
    } finally {
      setBookingsLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => { fetchUnreportedBookings() }, [fetchUnreportedBookings])

  // Fetch teacher plan
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('teachers')
      .select('plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.plan) setTeacherPlan(data.plan as TeacherPlan)
      })
  }, [user?.id, supabase])

  const isPro = teacherPlan === 'pro'

  // Update edited content when AI generates
  useEffect(() => {
    if (generatedContent) setEditedPublic(generatedContent)
  }, [generatedContent])

  const handleGenerate = async () => {
    if (!formData.contentRaw.trim() || !selectedBooking) return
    await generateReport({
      contentRaw: formData.contentRaw,
      studentName: selectedBooking.studentName,
      subject: formData.subject || undefined,
      goals: goals.filter(g => g.status === 'active').map(g => g.title),
      weakPoints: weakPoints.filter(w => w.status === 'active').map(w => `${w.subject}: ${w.topic}`),
      comprehensionLevel: formData.comprehensionLevel,
      studentMood: formData.studentMood,
      maxLength: formData.maxLength,
    })
  }

  const handleSave = async (publish: boolean) => {
    if (!selectedBooking) return
    setSaving(true)
    setSaveError(null)
    try {
      const reportData: Record<string, any> = {
        booking_id: selectedBooking.id,
        content_raw: formData.contentRaw,
        content_public: editedPublic || null,
        ai_summary: generatedContent || null,
        profile_id: selectedBooking.profileId,
        teacher_id: user!.id,
        subject: formData.subject || null,
        homework: formData.homework || null,
        next_plan: formData.nextPlan || null,
        student_mood: formData.studentMood || null,
        comprehension_level: formData.comprehensionLevel || null,
        visibility: publish ? 'public' : 'private',
        published_at: publish ? new Date().toISOString() : null,
      }

      const { data: insertedReport, error: err } = await supabase
        .from('reports')
        .insert(reportData)
        .select('id')
        .single()
      if (err) throw err

      // Fire-and-forget email notification on publish
      if (publish && insertedReport?.id) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'report_published', data: { reportId: insertedReport.id } }),
        }).catch(console.error)
      }

      toast.success(publish ? t('publishSuccess') : t('draftSuccess'))
      router.push('/teacher/reports')
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e))
      toast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const formatBookingLabel = (b: UnreportedBooking) => {
    const date = new Date(b.start_time)
    const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })
    const startStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    const endStr = new Date(b.end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} ${startStr}〜${endStr}  ${b.studentName}`
  }

  // Step indicator labels differ based on plan
  const steps = isPro
    ? [t('steps.selectBooking'), t('steps.inputMemo'), t('steps.aiGenerate'), t('steps.preview'), t('steps.save')]
    : [t('steps.selectBooking'), t('steps.inputMemo'), t('steps.preview'), t('steps.save')]

  const currentStep = isPro
    ? (!selectedBookingId ? 0 : !formData.contentRaw.trim() ? 1 : !editedPublic ? 2 : 3)
    : (!selectedBookingId ? 0 : !formData.contentRaw.trim() ? 1 : !editedPublic ? 2 : 3)

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <Link href="/teacher/reports" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{t('breadcrumbReports')}</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{t('breadcrumbNew')}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('title')}</h1>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${i <= currentStep ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <span className={`text-xs hidden sm:inline ${i <= currentStep ? 'text-brand-600 font-medium' : 'text-slate-400'}`}>{label}</span>
              {i < steps.length - 1 && <div className={`w-6 h-px ${i < currentStep ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {(aiError || saveError) && <ErrorAlert message={aiError || saveError || ''} />}

        <div className="space-y-6">
          {/* Step 1: Select booking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('step1Title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>{t('bookingLabel')}</Label>
              {bookingsLoading || authLoading ? (
                <div className="text-gray-500 dark:text-slate-400 text-sm">{tc('loading')}</div>
              ) : unreportedBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noUnreportedBookings')}</p>
              ) : (
                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                  <SelectTrigger><SelectValue placeholder={t('bookingPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {unreportedBookings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{formatBookingLabel(b)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Input form */}
          {selectedBookingId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('step2Title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportForm data={formData} onChange={setFormData} />
              </CardContent>
            </Card>
          )}

          {/* Step 3: AI Generate (Pro) or manual input prompt (Free) */}
          {selectedBookingId && formData.contentRaw.trim() && (
            <div className="flex justify-center">
              <AiGenerateButton
                onClick={handleGenerate}
                loading={aiLoading}
                disabled={!formData.contentRaw.trim() || !selectedBookingId}
                isPro={isPro}
                canGenerate={canGenerate}
                remainingGenerations={remainingGenerations}
                maxGenerations={maxGenerations}
              />
            </div>
          )}

          {/* Free plan: manual input area (shown when no AI-generated content) */}
          {!isPro && selectedBookingId && formData.contentRaw.trim() && !editedPublic && (
            <ReportPreview
              content={editedPublic}
              onChange={setEditedPublic}
            />
          )}

          {/* Step 4: Preview & Edit */}
          {editedPublic && (
            <>
              <ReportPreview
                content={editedPublic}
                onChange={setEditedPublic}
                onRegenerate={isPro ? handleGenerate : undefined}
                regenerating={aiLoading}
                canRegenerate={canGenerate}
                remainingGenerations={remainingGenerations}
              />

              {/* Step 5: Save */}
              <div className="flex justify-end gap-3">
                <LoadingButton variant="outline" onClick={() => handleSave(false)} loading={saving}>
                  <Save className="w-4 h-4 mr-1" />{t('saveDraft')}
                </LoadingButton>
                <LoadingButton onClick={() => handleSave(true)} loading={saving}>
                  <Send className="w-4 h-4 mr-1" />{t('publish')}
                </LoadingButton>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
