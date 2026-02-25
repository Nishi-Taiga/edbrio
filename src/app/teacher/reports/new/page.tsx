"use client"

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { useStudentKarte } from '@/hooks/use-student-karte'
import { useAiReport } from '@/hooks/use-ai-report'
import { createClient } from '@/lib/supabase/client'
import { ReportForm } from '@/components/reports/report-form'
import { AiGenerateButton } from '@/components/reports/ai-generate-button'
import { ReportPreview } from '@/components/reports/report-preview'

export default function NewReportPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8"><div className="text-gray-500">読み込み中...</div></div>
      </ProtectedRoute>
    }>
      <NewReportContent />
    </Suspense>
  )
}

function NewReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProfileId = searchParams.get('profileId')
  const { user, loading: authLoading } = useAuth()
  const { profiles, loading: profilesLoading } = useStudentProfiles(user?.id)
  const supabase = useMemo(() => createClient(), [])

  const [selectedProfileId, setSelectedProfileId] = useState(preselectedProfileId || '')
  const { goals, weakPoints } = useStudentKarte(selectedProfileId || undefined)
  const { generateReport, generatedContent, loading: aiLoading, error: aiError } = useAiReport()

  const [formData, setFormData] = useState({
    subject: '',
    contentRaw: '',
    comprehensionLevel: 3,
    studentMood: 'neutral',
    homework: '',
    nextPlan: '',
  })

  const [editedPublic, setEditedPublic] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Update edited content when AI generates
  useEffect(() => {
    if (generatedContent) setEditedPublic(generatedContent)
  }, [generatedContent])

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)

  const handleGenerate = async () => {
    if (!formData.contentRaw.trim() || !selectedProfile) return
    await generateReport({
      contentRaw: formData.contentRaw,
      studentName: selectedProfile.name,
      subject: formData.subject || undefined,
      goals: goals.filter(g => g.status === 'active').map(g => g.title),
      weakPoints: weakPoints.filter(w => w.status === 'active').map(w => `${w.subject}: ${w.topic}`),
      comprehensionLevel: formData.comprehensionLevel,
      studentMood: formData.studentMood,
    })
  }

  const handleSave = async (publish: boolean) => {
    if (!selectedProfileId) return
    setSaving(true)
    setSaveError(null)
    try {
      // Try to find a recent booking for this student (optional)
      let bookingId: string | null = null
      if (selectedProfile?.student_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id')
          .eq('teacher_id', user!.id)
          .eq('student_id', selectedProfile.student_id)
          .order('start_time', { ascending: false })
          .limit(1)
          .single()
        bookingId = booking?.id || null
      }

      const reportData: Record<string, any> = {
        booking_id: bookingId,
        content_raw: formData.contentRaw,
        content_public: editedPublic || null,
        ai_summary: generatedContent || null,
        profile_id: selectedProfileId,
        teacher_id: user!.id,
        subject: formData.subject || null,
        homework: formData.homework || null,
        next_plan: formData.nextPlan || null,
        student_mood: formData.studentMood || null,
        comprehension_level: formData.comprehensionLevel || null,
        visibility: publish ? 'public' : 'private',
        published_at: publish ? new Date().toISOString() : null,
      }

      const { error: err } = await supabase.from('reports').insert(reportData)
      if (err) throw err

      router.push('/teacher/reports')
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/teacher/reports">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">レポート作成</h1>
        </div>

        {(aiError || saveError) && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">
            {aiError || saveError}
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: Select student */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. 生徒を選択</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>生徒</Label>
              {profilesLoading || authLoading ? (
                <div className="text-gray-500 text-sm">読み込み中...</div>
              ) : (
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger><SelectValue placeholder="生徒を選択..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.grade ? ` (${p.grade})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Input form */}
          {selectedProfileId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. 授業メモを入力</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportForm data={formData} onChange={setFormData} />
              </CardContent>
            </Card>
          )}

          {/* Step 3: AI Generate */}
          {selectedProfileId && formData.contentRaw.trim() && (
            <div className="flex justify-center">
              <AiGenerateButton
                onClick={handleGenerate}
                loading={aiLoading}
                disabled={!formData.contentRaw.trim() || !selectedProfileId}
              />
            </div>
          )}

          {/* Step 4: Preview & Edit */}
          {editedPublic && (
            <>
              <ReportPreview
                content={editedPublic}
                onChange={setEditedPublic}
                onRegenerate={handleGenerate}
                regenerating={aiLoading}
              />

              {/* Step 5: Save */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" />{saving ? '保存中...' : '下書き保存'}
                </Button>
                <Button onClick={() => handleSave(true)} disabled={saving}>
                  <Send className="w-4 h-4 mr-1" />{saving ? '保存中...' : '公開'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
