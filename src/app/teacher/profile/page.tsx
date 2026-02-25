"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit2, X } from 'lucide-react'

type TeacherRow = {
  id: string
  handle: string
  subjects: string[]
  grades: string[]
  plan: 'free' | 'pro'
  public_profile: Record<string, unknown>
  stripe_account_id?: string
  is_onboarding_complete?: boolean
}

export default function TeacherProfilePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedHandle, setEditedHandle] = useState('')
  const [editedSubjects, setEditedSubjects] = useState('')
  const [editedGrades, setEditedGrades] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

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
          .select('id,handle,subjects,grades,plan,public_profile,stripe_account_id,is_onboarding_complete')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (mounted) {
          setTeacher(data)
          setEditedHandle(data?.handle || '')
          setEditedSubjects((data?.subjects || []).join(', '))
          setEditedGrades((data?.grades || []).join(', '))
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
      const { error } = await supabase
        .from('teachers')
        .update({
          handle: editedHandle,
          subjects: editedSubjects.split(',').map(s => s.trim()).filter(Boolean),
          grades: editedGrades.split(',').map(g => g.trim()).filter(Boolean),
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.id)
      if (error) throw error

      setTeacher({
        ...teacher,
        handle: editedHandle,
        subjects: editedSubjects.split(',').map(s => s.trim()).filter(Boolean),
        grades: editedGrades.split(',').map(g => g.trim()).filter(Boolean),
      })
      setIsEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>公開プロフィールの概要</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">{error}</div>
            )}
            {loading ? (
              <div className="text-gray-500 dark:text-slate-400">読み込み中...</div>
            ) : !teacher ? (
              <div className="text-gray-500 dark:text-slate-400">プロフィールが見つかりません。</div>
            ) : isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ハンドル</label>
                  <Input value={editedHandle} onChange={(e) => setEditedHandle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">担当科目（カンマ区切り）</label>
                  <Input value={editedSubjects} onChange={(e) => setEditedSubjects(e.target.value)} placeholder="算数, 数学, 英語" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">対象学年（カンマ区切り）</label>
                  <Input value={editedGrades} onChange={(e) => setEditedGrades(e.target.value)} placeholder="小1, 小2, 中1" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>キャンセル</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '保存中...' : <><Check className="w-4 h-4 mr-1" /> 保存</>}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-gray-700 dark:text-slate-300 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">ハンドル</span> {teacher.handle}</div>
                  <div><span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">プラン</span> {teacher.plan}</div>
                  <div><span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">科目</span> {(teacher.subjects || []).join(' / ') || '-'}</div>
                  <div><span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">学年</span> {(teacher.grades || []).join(' / ') || '-'}</div>
                  <div>
                    <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">Stripe 連携</span>
                    {teacher.stripe_account_id ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">連携済み ({teacher.stripe_account_id})</span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-1"
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
                        Stripe アカウントを作成・連携
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-1">公開プロフィール (データ)</span>
                  <pre className="p-2 bg-gray-50 dark:bg-surface border dark:border-brand-800/20 rounded overflow-x-auto">{JSON.stringify(teacher.public_profile || {}, null, 2)}</pre>
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" /> プロフィールを編集
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

