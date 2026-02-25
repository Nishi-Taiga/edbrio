"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAiReport } from '@/hooks/use-ai-report'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/lib/types/database'
import { ReportForm } from '@/components/reports/report-form'
import { AiGenerateButton } from '@/components/reports/ai-generate-button'
import { ReportPreview } from '@/components/reports/report-preview'
import { ComprehensionBadge } from '@/components/reports/comprehension-badge'
import { MoodIndicator } from '@/components/reports/mood-indicator'

export default function ReportDetailPage() {
  const params = useParams()
  const reportId = params.reportId as string
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { generateReport, generatedContent, loading: aiLoading, error: aiError } = useAiReport()
  const supabase = useMemo(() => createClient(), [])

  const [report, setReport] = useState<Report | null>(null)
  const [profileName, setProfileName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    subject: '',
    contentRaw: '',
    comprehensionLevel: 3,
    studentMood: 'neutral',
    homework: '',
    nextPlan: '',
  })
  const [editedPublic, setEditedPublic] = useState('')

  useEffect(() => {
    if (!reportId) return
    let mounted = true
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()
        if (err) throw err
        if (!mounted) return
        setReport(data)
        setFormData({
          subject: data.subject || '',
          contentRaw: data.content_raw || '',
          comprehensionLevel: data.comprehension_level || 3,
          studentMood: data.student_mood || 'neutral',
          homework: data.homework || '',
          nextPlan: data.next_plan || '',
        })
        setEditedPublic(data.content_public || '')

        if (data.profile_id) {
          const { data: profile } = await supabase
            .from('student_profiles')
            .select('name')
            .eq('id', data.profile_id)
            .single()
          if (profile && mounted) setProfileName(profile.name)
        }
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [reportId, supabase])

  const handleRegenerate = async () => {
    if (!formData.contentRaw.trim()) return
    await generateReport({
      contentRaw: formData.contentRaw,
      studentName: profileName || '生徒',
      subject: formData.subject || undefined,
      comprehensionLevel: formData.comprehensionLevel,
      studentMood: formData.studentMood,
    })
  }

  useEffect(() => {
    if (generatedContent) setEditedPublic(generatedContent)
  }, [generatedContent])

  const handleSave = async (publish: boolean) => {
    setSaving(true)
    try {
      const updates: Record<string, any> = {
        content_raw: formData.contentRaw,
        content_public: editedPublic || null,
        subject: formData.subject || null,
        homework: formData.homework || null,
        next_plan: formData.nextPlan || null,
        student_mood: formData.studentMood || null,
        comprehension_level: formData.comprehensionLevel || null,
        updated_at: new Date().toISOString(),
      }
      if (publish) {
        updates.visibility = 'public'
        updates.published_at = new Date().toISOString()
      }
      const { error: err } = await supabase.from('reports').update(updates).eq('id', reportId)
      if (err) throw err
      router.push('/teacher/reports')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8"><div className="text-gray-500">読み込み中...</div></div>
      </ProtectedRoute>
    )
  }

  if (!report) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">レポートが見つかりません。</div>
          <Link href="/teacher/reports"><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る</Button></Link>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/teacher/reports"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">レポート詳細</h1>
              {profileName && <p className="text-gray-600 dark:text-gray-400 text-sm">{profileName}</p>}
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'プレビュー' : '編集'}
          </Button>
        </div>

        {(error || aiError) && (
          <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700">{error || aiError}</div>
        )}

        {/* Read-only view */}
        {!editing && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">レポート情報</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {report.subject && <div><dt className="text-gray-500">教科</dt><dd>{report.subject}</dd></div>}
                  {report.comprehension_level && <div><dt className="text-gray-500">理解度</dt><dd><ComprehensionBadge level={report.comprehension_level} /></dd></div>}
                  {report.student_mood && <div><dt className="text-gray-500">様子</dt><dd><MoodIndicator mood={report.student_mood} /></dd></div>}
                  <div><dt className="text-gray-500">公開状態</dt><dd>{report.visibility === 'public' ? '公開済み' : '下書き'}</dd></div>
                </dl>
              </CardContent>
            </Card>
            {report.content_public && (
              <Card>
                <CardHeader><CardTitle className="text-base">保護者向け報告書</CardTitle></CardHeader>
                <CardContent><div className="whitespace-pre-wrap text-sm">{report.content_public}</div></CardContent>
              </Card>
            )}
            {report.content_raw && (
              <Card>
                <CardHeader><CardTitle className="text-base">授業メモ（講師用）</CardTitle></CardHeader>
                <CardContent><div className="whitespace-pre-wrap text-sm text-gray-600">{report.content_raw}</div></CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">授業メモを編集</CardTitle></CardHeader>
              <CardContent>
                <ReportForm data={formData} onChange={setFormData} />
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <AiGenerateButton onClick={handleRegenerate} loading={aiLoading} disabled={!formData.contentRaw.trim()} />
            </div>

            {editedPublic && (
              <ReportPreview content={editedPublic} onChange={setEditedPublic} onRegenerate={handleRegenerate} regenerating={aiLoading} />
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />{saving ? '保存中...' : '下書き保存'}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving}>
                <Send className="w-4 h-4 mr-1" />{saving ? '保存中...' : '公開'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
