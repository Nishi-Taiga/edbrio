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

type TeacherRow = {
  id: string
  handle: string
  subjects: string[]
  grades: string[]
  plan: 'free' | 'pro'
  public_profile: Record<string, unknown>
  stripe_account_id?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  is_onboarding_complete?: boolean
}

export default function TeacherProfilePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-gray-500 dark:text-slate-400">読み込み中...</div>}>
      <TeacherProfileContent />
    </Suspense>
  )
}

const SUBJECT_OPTIONS = [
  '国語', '算数', '数学', '英語', '理科', '社会',
  '物理', '化学', '生物', '地学',
  '日本史', '世界史', '地理', '政治経済',
  '古文', '漢文', '小論文', '情報',
]

const GRADE_OPTIONS = [
  '小1', '小2', '小3', '小4', '小5', '小6',
  '中1', '中2', '中3',
  '高1', '高2', '高3',
]

function TeacherProfileContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedHandle, setEditedHandle] = useState('')
  const [editedSubjects, setEditedSubjects] = useState<string[]>([])
  const [editedGrades, setEditedGrades] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)

  const { theme, setTheme } = useTheme()
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()

  // Show toast for subscription redirect results
  useEffect(() => {
    const status = searchParams.get('subscription')
    if (status === 'success') {
      toast.success('Proプランへのアップグレードが完了しました！')
    } else if (status === 'canceled') {
      toast.info('アップグレードがキャンセルされました。')
    }
  }, [searchParams])

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
          .select('id,handle,subjects,grades,plan,public_profile,stripe_account_id,stripe_customer_id,stripe_subscription_id,is_onboarding_complete')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (mounted) {
          setTeacher(data)
          setEditedHandle(data?.handle || '')
          setEditedSubjects(data?.subjects || [])
          setEditedGrades(data?.grades || [])
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
          subjects: editedSubjects,
          grades: editedGrades,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.id)
      if (error) throw error

      setTeacher({
        ...teacher,
        handle: editedHandle,
        subjects: editedSubjects,
        grades: editedGrades,
      })
      setIsEditing(false)
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
      setError(err instanceof Error ? err.message : 'アップグレードに失敗しました。')
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
      setError(err instanceof Error ? err.message : 'ポータルの作成に失敗しました。')
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>設定</CardTitle>
            <CardDescription>プロフィール・テーマ・プランの管理</CardDescription>
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
                  <label className="block text-sm font-medium mb-2">担当科目</label>
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
                  <label className="block text-sm font-medium mb-2">対象学年</label>
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

                {/* プラン・サブスクリプション */}
                <div>
                  <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-2">プラン</span>
                  {teacher.plan === 'pro' ? (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/30">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-brand-600 text-white">Pro</Badge>
                        <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                          Standardプラン (¥1,480/月)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManageSubscription}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading ? '読み込み中...' : 'サブスクリプション管理'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-surface border border-gray-200 dark:border-brand-800/20">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Free</Badge>
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          手数料 7% / Proなら 2%
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleUpgrade}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading ? '処理中...' : 'Proにアップグレード'}
                      </Button>
                    </div>
                  )}
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

        {/* テーマ設定 */}
        <Card>
          <CardHeader>
            <CardTitle>テーマ</CardTitle>
            <CardDescription>表示モードを切り替えます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="text-sm font-semibold">ライト</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
              >
                <Moon className="w-6 h-6 text-brand-500" />
                <span className="text-sm font-semibold">ダーク</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'system' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
              >
                <Monitor className="w-6 h-6 text-slate-500" />
                <span className="text-sm font-semibold">自動</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* プラン機能比較 */}
        {teacher && (
          <Card>
            <CardHeader>
              <CardTitle>プラン比較</CardTitle>
              <CardDescription>Free と Standard プランの機能差分</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-slate-300">機能</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-500 dark:text-slate-400">Free</th>
                      <th className="text-center py-3 pl-4 font-semibold text-brand-600 dark:text-brand-400">Standard</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-slate-300">
                    <tr className="border-b border-dashed">
                      <td className="py-3 pr-4">生徒数</td>
                      <td className="text-center py-3 px-4">2名まで</td>
                      <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">無制限</td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-3 pr-4">AI報告書生成</td>
                      <td className="text-center py-3 px-4">月5件まで</td>
                      <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">無制限</td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-3 pr-4">予定・カレンダー管理</td>
                      <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                      <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-3 pr-4">生徒カルテ</td>
                      <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                      <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-3 pr-4">Stripe決済連携</td>
                      <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                      <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-3 pr-4">決済手数料</td>
                      <td className="text-center py-3 px-4">7%</td>
                      <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">2%</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">優先サポート</td>
                      <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                      <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {teacher.plan !== 'pro' && (
                <div className="mt-6 flex justify-center">
                  <Button onClick={handleUpgrade} disabled={isSubscriptionLoading}>
                    {isSubscriptionLoading ? '処理中...' : 'Standardプランにアップグレード（30日間無料）'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
