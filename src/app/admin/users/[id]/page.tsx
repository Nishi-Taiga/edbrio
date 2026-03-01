'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ArrowLeft, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingButton } from '@/components/ui/loading-button'

// ── Types ──

interface UserDetail {
  id: string
  name: string
  email: string
  role: 'teacher' | 'guardian' | 'student'
  created_at: string
  updated_at: string
  is_suspended: boolean
  // Teacher-specific
  teacher?: {
    plan: string
    stripe_account_id: string | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    is_onboarding_complete: boolean
  } | null
  student_count?: number
  recent_payments?: Payment[]
  tickets?: Ticket[]
  // Guardian-specific (guardian role)
  guardian?: {
    phone: string | null
  } | null
  students?: Student[]
  ticket_balances?: TicketBalance[]
  // Student-specific
  student?: {
    id: string
    grade: string | null
    notes: string | null
    guardian_id: string | null
    subjects?: string[]
    grades?: string[]
  } | null
  // For student role: guardian info as SimpleUser
  student_guardian?: SimpleUser | null
  assigned_teachers?: SimpleUser[]
  recent_bookings?: Booking[]
}

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
  currency?: string
}

interface Ticket {
  id: string
  title?: string
  student_id?: string
  remaining?: number
  total?: number
  created_at: string
}

interface TicketBalance {
  id: string
  student_id: string
  remaining: number
  total: number
}

interface Student {
  id: string
  name?: string
  grade?: string | null
  guardian_id?: string | null
}

interface SimpleUser {
  id: string
  name: string
  email: string
}

interface Booking {
  id: string
  teacher_id?: string
  student_id?: string
  start_time?: string
  end_time?: string
  status?: string
  created_at: string
}

// ── Helpers ──

const ROLE_LABELS: Record<string, string> = {
  teacher: '講師',
  guardian: '保護者',
  student: '生徒',
}

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  teacher: 'default',
  guardian: 'secondary',
  student: 'outline',
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(cents / 100)
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'PPP', { locale: ja })
}

function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'PPP p', { locale: ja })
}

// ── Component ──

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Action states
  const [planLoading, setPlanLoading] = useState(false)
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'ユーザー情報の取得に失敗しました。')
      }
      const data = await res.json()
      // Remap: for students, the API returns `guardian` as a SimpleUser
      // but our type uses `guardian` for guardian-role phone data.
      // Store it as `student_guardian` to avoid conflicts.
      if (data.role === 'student' && data.guardian) {
        data.student_guardian = data.guardian
        delete data.guardian
      }
      setUser(data as UserDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchUser()
  }, [userId, fetchUser])

  // ── Actions ──

  async function handlePlanChange() {
    if (!user || !user.teacher) return
    const newPlan = user.teacher.plan === 'free' ? 'pro' : 'free'
    setPlanLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'プランの変更に失敗しました。')
      }
      setPlanDialogOpen(false)
      await fetchUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プランの変更に失敗しました。')
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleSuspendToggle() {
    if (!user) return
    const newSuspended = !user.is_suspended
    setSuspendLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_suspended: newSuspended }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'ステータスの変更に失敗しました。')
      }
      setSuspendDialogOpen(false)
      await fetchUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ステータスの変更に失敗しました。')
    } finally {
      setSuspendLoading(false)
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={4} />
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert message={error} onRetry={fetchUser} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={Users}
          title="ユーザーが見つかりません"
          action={{ label: '一覧に戻る', href: '/admin/users' }}
        />
      </div>
    )
  }

  const currentPlan = user.teacher?.plan ?? 'free'
  const targetPlanLabel = currentPlan === 'free' ? 'Standard' : 'Free'

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/users')}
              className="gap-1 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
              ユーザー管理
            </Button>
            <span>/</span>
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'outline'}>
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            {user.role === 'teacher' && user.teacher && (
              <Badge variant="secondary">
                {user.teacher.plan === 'pro' ? 'Standard' : 'Free'}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user.role === 'teacher' && user.teacher && (
            <Button variant="outline" size="sm" onClick={() => setPlanDialogOpen(true)}>
              {targetPlanLabel}に変更
            </Button>
          )}
          <Button
            variant={user.is_suspended ? 'outline' : 'destructive'}
            size="sm"
            onClick={() => setSuspendDialogOpen(true)}
          >
            {user.is_suspended ? '停止解除' : 'アカウント停止'}
          </Button>
        </div>
      </div>

      {/* Inline error for action failures */}
      {error && <ErrorAlert message={error} />}

      {/* User info card */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">名前</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">メール</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ロール</dt>
              <dd>
                <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'outline'}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">登録日</dt>
              <dd className="font-medium">{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ステータス</dt>
              <dd>
                {user.is_suspended ? (
                  <Badge variant="destructive">停止中</Badge>
                ) : (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">有効</Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Role-specific tabs */}
      {user.role === 'teacher' && <TeacherTabs user={user} />}
      {user.role === 'guardian' && <GuardianTabs user={user} />}
      {user.role === 'student' && <StudentTabs user={user} />}

      {/* Plan change dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プラン変更の確認</DialogTitle>
            <DialogDescription>
              {user.name} のプランを {targetPlanLabel} に変更しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              キャンセル
            </Button>
            <LoadingButton loading={planLoading} onClick={handlePlanChange}>
              変更する
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend toggle dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.is_suspended ? '停止解除の確認' : 'アカウント停止の確認'}
            </DialogTitle>
            <DialogDescription>
              {user.is_suspended
                ? `${user.name} のアカウント停止を解除しますか？`
                : `${user.name} のアカウントを停止しますか？このユーザーはログインできなくなります。`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              キャンセル
            </Button>
            <LoadingButton
              loading={suspendLoading}
              variant={user.is_suspended ? 'default' : 'destructive'}
              onClick={handleSuspendToggle}
            >
              {user.is_suspended ? '停止解除する' : '停止する'}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Teacher Tabs ──

function TeacherTabs({ user }: { user: UserDetail }) {
  const teacher = user.teacher

  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">基本情報</TabsTrigger>
        <TabsTrigger value="students">生徒</TabsTrigger>
        <TabsTrigger value="revenue">売上</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>講師情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">プラン</dt>
                <dd>
                  <Badge variant="secondary">
                    {teacher?.plan === 'pro' ? 'Standard' : 'Free'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Stripe Account ID</dt>
                <dd className="font-mono text-xs">
                  {teacher?.stripe_account_id || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Stripe Customer ID</dt>
                <dd className="font-mono text-xs">
                  {teacher?.stripe_customer_id || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Stripe Subscription ID</dt>
                <dd className="font-mono text-xs">
                  {teacher?.stripe_subscription_id || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">オンボーディング完了</dt>
                <dd>
                  {teacher?.is_onboarding_complete ? (
                    <Badge className="bg-green-600 text-white hover:bg-green-700">完了</Badge>
                  ) : (
                    <Badge variant="outline">未完了</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="students" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>生徒</CardTitle>
            <CardDescription>登録生徒数: {user.student_count ?? 0}名</CardDescription>
          </CardHeader>
          <CardContent>
            {(user.student_count ?? 0) === 0 ? (
              <EmptyState
                icon={Users}
                title="生徒がまだ登録されていません"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                この講師には {user.student_count} 名の生徒が登録されています。
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="revenue" className="mt-4 space-y-4">
        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle>最近の売上</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.recent_payments || user.recent_payments.length === 0 ? (
              <EmptyState icon={Users} title="売上データはありません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.recent_payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.created_at)}</TableCell>
                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.status === 'succeeded' ? 'default' : 'outline'}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>チケット</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.tickets || user.tickets.length === 0 ? (
              <EmptyState icon={Users} title="チケットデータはありません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>作成日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.tickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">
                          {t.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{formatDate(t.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// ── Guardian Tabs ──

function GuardianTabs({ user }: { user: UserDetail }) {
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">基本情報</TabsTrigger>
        <TabsTrigger value="students-tickets">生徒/チケット</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>保護者情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">電話番号</dt>
                <dd className="font-medium">{user.guardian?.phone || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="students-tickets" className="mt-4 space-y-4">
        {/* Linked students */}
        <Card>
          <CardHeader>
            <CardTitle>生徒一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.students || user.students.length === 0 ? (
              <EmptyState icon={Users} title="紐づけされた生徒はいません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>学年</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">
                          {s.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{s.grade || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment history */}
        <Card>
          <CardHeader>
            <CardTitle>支払い履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.recent_payments || user.recent_payments.length === 0 ? (
              <EmptyState icon={Users} title="支払い履歴はありません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.recent_payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.created_at)}</TableCell>
                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.status === 'succeeded' ? 'default' : 'outline'}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket balances */}
        <Card>
          <CardHeader>
            <CardTitle>チケット残高</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.ticket_balances || user.ticket_balances.length === 0 ? (
              <EmptyState icon={Users} title="チケットデータはありません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>生徒ID</TableHead>
                      <TableHead>残数</TableHead>
                      <TableHead>合計</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.ticket_balances.map((tb) => (
                      <TableRow key={tb.id}>
                        <TableCell className="font-mono text-xs">
                          {tb.student_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{tb.remaining}</TableCell>
                        <TableCell>{tb.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// ── Student Tabs ──

function StudentTabs({ user }: { user: UserDetail }) {
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">基本情報</TabsTrigger>
        <TabsTrigger value="bookings">予約</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>生徒情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">学年</dt>
                <dd className="font-medium">{user.student?.grade || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">メモ</dt>
                <dd className="font-medium">{user.student?.notes || '-'}</dd>
              </div>
              {user.student_guardian && (
                <>
                  <div>
                    <dt className="text-muted-foreground">保護者名</dt>
                    <dd className="font-medium">{user.student_guardian.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">保護者メール</dt>
                    <dd className="font-medium">{user.student_guardian.email}</dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bookings" className="mt-4 space-y-4">
        {/* Recent bookings */}
        <Card>
          <CardHeader>
            <CardTitle>最近の予約</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.recent_bookings || user.recent_bookings.length === 0 ? (
              <EmptyState icon={Users} title="予約データはありません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日時</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.recent_bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          {b.start_time
                            ? formatDateTime(b.start_time)
                            : formatDate(b.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'confirmed' ? 'default' : 'outline'}>
                            {b.status || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned teachers */}
        <Card>
          <CardHeader>
            <CardTitle>担当講師</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.assigned_teachers || user.assigned_teachers.length === 0 ? (
              <EmptyState icon={Users} title="担当講師はいません" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead>メール</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.assigned_teachers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
