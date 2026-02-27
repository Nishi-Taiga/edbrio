"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit2, X, ExternalLink } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { getStripe } from '@/lib/stripe'
import { toast } from 'sonner'

type PublicProfile = {
  display_name?: string
  bio?: string
  area?: string
  experience_years?: string
}

type TeacherRow = {
  id: string
  handle: string
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
  const [editedProfile, setEditedProfile] = useState<PublicProfile>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)

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
          const profile = (data?.public_profile || {}) as PublicProfile
          setTeacher(data)
          setEditedHandle(data?.handle || '')
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
      const { error } = await supabase
        .from('teachers')
        .update({
          handle: editedHandle,
          subjects: editedSubjects,
          grades: editedGrades,
          public_profile: editedProfile,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.id)
      if (error) throw error

      setTeacher({
        ...teacher,
        handle: editedHandle,
        subjects: editedSubjects,
        grades: editedGrades,
        public_profile: editedProfile,
      })
      setIsEditing(false)
      toast.success('プロフィールを保存しました。')
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

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-500 dark:text-slate-400">読み込み中...</div>
        ) : !teacher ? (
          <div className="text-gray-500 dark:text-slate-400">プロフィールが見つかりません。</div>
        ) : isEditing ? (
          /* ── 編集モード ── */
          <Card>
            <CardHeader>
              <CardTitle>プロフィール編集</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">ハンドル（URL用）</label>
                  <Input value={editedHandle} onChange={(e) => setEditedHandle(e.target.value)} required />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">公開ページ: {appUrl}/teacher/{editedHandle || '...'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">表示名</label>
                  <Input
                    value={editedProfile.display_name || ''}
                    onChange={(e) => setEditedProfile(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="例: 山田太郎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">自己紹介</label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="例: 東京大学卒。中学・高校数学を10年以上指導しています。"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">指導エリア</label>
                  <Input
                    value={editedProfile.area || ''}
                    onChange={(e) => setEditedProfile(p => ({ ...p, area: e.target.value }))}
                    placeholder="例: 東京都渋谷区 / オンライン対応"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">指導歴</label>
                  <Input
                    value={editedProfile.experience_years || ''}
                    onChange={(e) => setEditedProfile(p => ({ ...p, experience_years: e.target.value }))}
                    placeholder="例: 5年"
                  />
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
            </CardContent>
          </Card>
        ) : (
          /* ── 表示モード ── */
          <>
            {/* プロフィール */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>プロフィール</CardTitle>
                  <CardDescription>公開プロフィールの設定</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" /> 編集
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 dark:text-slate-300 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">表示名</span>
                      {teacher.public_profile?.display_name || <span className="text-gray-400">未設定</span>}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">ハンドル</span>
                      {teacher.handle}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">自己紹介</span>
                      {teacher.public_profile?.bio ? (
                        <p className="whitespace-pre-wrap">{teacher.public_profile.bio}</p>
                      ) : (
                        <span className="text-gray-400">未設定</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">指導エリア</span>
                      {teacher.public_profile?.area || <span className="text-gray-400">未設定</span>}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">指導歴</span>
                      {teacher.public_profile?.experience_years || <span className="text-gray-400">未設定</span>}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">科目</span>
                      {(teacher.subjects || []).join(' / ') || '-'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase">学年</span>
                      {(teacher.grades || []).join(' / ') || '-'}
                    </div>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`/teacher/${teacher.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> 公開ページを見る
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* プラン・サブスクリプション */}
            <Card>
              <CardHeader>
                <CardTitle>プラン</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.plan === 'pro' ? (
                  <div className="space-y-4">
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

                    {/* Stripe 連携 - Proプランのみ表示 */}
                    <div>
                      <span className="font-medium text-gray-500 dark:text-slate-400 block text-xs uppercase mb-2">Stripe 決済連携</span>
                      {teacher.stripe_account_id ? (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">連携済み</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-slate-400">月謝の請求・入金を受け取るにはStripe連携が必要です。</span>
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
                            Stripe 連携
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
