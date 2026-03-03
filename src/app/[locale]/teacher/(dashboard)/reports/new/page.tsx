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
import { Save, Send, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentCurriculum } from '@/hooks/use-student-curriculum'
import { useAiReport } from '@/hooks/use-ai-report'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ReportForm } from '@/components/reports/report-form'
import { AiGenerateButton } from '@/components/reports/ai-generate-button'
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
  subjects: string[]
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
  const tf = useTranslations('reportForm')
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
  const { goals, skills } = useStudentCurriculum(selectedProfileId || undefined)
  const {
    generateReport, generatedContent, tokensUsed, loading: aiLoading, error: aiError,
    canGenerate, remainingGenerations, maxGenerations,
  } = useAiReport()

  const [formData, setFormData] = useState({
    subject: '',
    contentRaw: '',
    comprehensionLevel: 3,
    studentMood: 'neutral',
    homework: '',
    nextPlan: '',
    maxLength: 100,
  })

  const [memoSubmitted, setMemoSubmitted] = useState<'ai' | 'skip' | null>(null)
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
        .select('id, student_id, name, subjects')
        .eq('teacher_id', user.id)

      const profileMap = new Map<string, { id: string; name: string; subjects: string[] }>()
      for (const p of profiles || []) {
        if (p.student_id) profileMap.set(p.student_id, { id: p.id, name: p.name, subjects: p.subjects || [] })
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
            subjects: profile.subjects,
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

  const isPro = teacherPlan === 'standard'

  // Auto-set subject from selected booking's student subjects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedBooking) {
      setFormData(prev => ({ ...prev, subject: selectedBooking.subjects?.join('・') || '' }))
    }
  }, [selectedBooking?.id])

  const handleBookingChange = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setMemoSubmitted(null)
  }

  const handleGenerate = async () => {
    if (!formData.contentRaw.trim() || !selectedBooking) return
    await generateReport({
      contentRaw: formData.contentRaw,
      studentName: selectedBooking.studentName,
      subject: formData.subject || undefined,
      goals: goals.filter(g => g.status === 'active').map(g => g.title),
      weakPoints: skills.filter(s => s.rating <= 2).map(s => `${s.subject}: ${s.topic}`),
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
        content_public: generatedContent || null,
        ai_summary: generatedContent || null,
        tokens_used: tokensUsed || null,
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
    const subjectStr = b.subjects.length > 0 ? ` [${b.subjects.join('・')}]` : ''
    return `${dateStr} ${startStr}〜${endStr}  ${b.studentName}${subjectStr}`
  }

  // Step indicator labels differ based on chosen path
  const showAiSteps = memoSubmitted === 'ai' || (!memoSubmitted && isPro)
  const steps = showAiSteps
    ? [t('steps.selectBooking'), t('steps.inputMemo'), t('steps.aiGenerate'), t('steps.preview')]
    : [t('steps.selectBooking'), t('steps.inputMemo'), t('steps.preview')]

  const showPreview = memoSubmitted === 'skip' || (memoSubmitted === 'ai' && !!generatedContent)

  const currentStep = (() => {
    if (!selectedBookingId) return 0
    if (!memoSubmitted) return 1
    if (!showPreview) return 2
    return showAiSteps ? 3 : 2
  })()

  const moodDisplay: Record<string, string> = {
    good: tf('moodGood'), neutral: tf('moodNeutral'),
    tired: tf('moodTired'), unmotivated: tf('moodUnmotivated'),
  }
  const comprehensionDisplay: Record<number, string> = {
    1: tf('comprehension1'), 2: tf('comprehension2'), 3: tf('comprehension3'),
    4: tf('comprehension4'), 5: tf('comprehension5'),
  }

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
                <Select value={selectedBookingId} onValueChange={handleBookingChange}>
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
                {/* Navigation buttons */}
                {!memoSubmitted && (
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      onClick={() => setMemoSubmitted('skip')}
                      disabled={!formData.contentRaw.trim()}
                    >
                      {t('skipAi')}
                    </Button>
                    <Button
                      onClick={() => setMemoSubmitted('ai')}
                      disabled={!formData.contentRaw.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      {t('proceedToAi')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3a: AI Generate */}
          {memoSubmitted === 'ai' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('steps.aiGenerate')}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Unified Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('steps.preview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{tf('contentLabel').replace(' *', '')}</p>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 rounded-md p-3">{formData.contentRaw}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{tf('comprehensionLabel')}</p>
                    <p className="text-sm">{comprehensionDisplay[formData.comprehensionLevel]}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{tf('moodLabel')}</p>
                    <p className="text-sm">{moodDisplay[formData.studentMood]}</p>
                  </div>
                </div>

                {formData.homework && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{tf('homeworkLabel')}</p>
                    <p className="text-sm">{formData.homework}</p>
                  </div>
                )}

                {formData.nextPlan && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{tf('nextPlanLabel')}</p>
                    <p className="text-sm">{formData.nextPlan}</p>
                  </div>
                )}

                {generatedContent && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('aiReportLabel')}</p>
                    <p className="text-sm whitespace-pre-wrap bg-purple-50 dark:bg-purple-900/20 rounded-md p-3">{generatedContent}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <LoadingButton variant="outline" onClick={() => handleSave(false)} loading={saving}>
                    <Save className="w-4 h-4 mr-1" />{t('saveDraft')}
                  </LoadingButton>
                  <LoadingButton onClick={() => handleSave(true)} loading={saving}>
                    <Send className="w-4 h-4 mr-1" />{t('publish')}
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
