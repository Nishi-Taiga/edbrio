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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('adminUserDetail')
  const tc = useTranslations('adminCommon')

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
        throw new Error(body.error || t('fetchError'))
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
      setError(err instanceof Error ? err.message : t('fetchError'))
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
    const newPlan = user.teacher.plan === 'free' ? 'standard' : 'free'
    setPlanLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || t('planChangeError'))
      }
      setPlanDialogOpen(false)
      await fetchUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('planChangeError'))
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
        throw new Error(body.error || t('statusChangeError'))
      }
      setSuspendDialogOpen(false)
      await fetchUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('statusChangeError'))
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
          title={t('userNotFound')}
          action={{ label: t('backToList'), href: '/admin/users' }}
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
              {t('backToUsers')}
            </Button>
            <span>/</span>
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'outline'}>
              {tc(user.role as 'teacher' | 'guardian' | 'student')}
            </Badge>
            {user.role === 'teacher' && user.teacher && (
              <Badge variant="secondary">
                {user.teacher.plan === 'standard' ? 'Standard' : 'Free'}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user.role === 'teacher' && user.teacher && (
            <Button variant="outline" size="sm" onClick={() => setPlanDialogOpen(true)}>
              {t('changePlanTo', { plan: targetPlanLabel })}
            </Button>
          )}
          <Button
            variant={user.is_suspended ? 'outline' : 'destructive'}
            size="sm"
            onClick={() => setSuspendDialogOpen(true)}
          >
            {user.is_suspended ? t('unsuspend') : t('suspend')}
          </Button>
        </div>
      </div>

      {/* Inline error for action failures */}
      {error && <ErrorAlert message={error} />}

      {/* User info card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('userInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{tc('name')}</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{tc('email')}</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('role')}</dt>
              <dd>
                <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'outline'}>
                  {tc(user.role as 'teacher' | 'guardian' | 'student')}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{tc('registeredDate')}</dt>
              <dd className="font-medium">{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{tc('status')}</dt>
              <dd>
                {user.is_suspended ? (
                  <Badge variant="destructive">{tc('statusSuspended')}</Badge>
                ) : (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">{tc('statusActive')}</Badge>
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
            <DialogTitle>{t('planChangeConfirm')}</DialogTitle>
            <DialogDescription>
              {t('planChangeDescription', { name: user.name, plan: targetPlanLabel })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <LoadingButton loading={planLoading} onClick={handlePlanChange}>
              {tc('confirm')}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend toggle dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.is_suspended ? t('unsuspendConfirm') : t('suspendConfirm')}
            </DialogTitle>
            <DialogDescription>
              {user.is_suspended
                ? t('unsuspendDescription', { name: user.name })
                : t('suspendDescription', { name: user.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <LoadingButton
              loading={suspendLoading}
              variant={user.is_suspended ? 'default' : 'destructive'}
              onClick={handleSuspendToggle}
            >
              {user.is_suspended ? t('unsuspendAction') : t('suspendAction')}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Teacher Tabs ──

function TeacherTabs({ user }: { user: UserDetail }) {
  const t = useTranslations('adminUserDetail')
  const tc = useTranslations('adminCommon')
  const tu = useTranslations('adminUsers')
  const teacher = user.teacher

  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">{t('teacherTabInfo')}</TabsTrigger>
        <TabsTrigger value="students">{t('teacherTabStudents')}</TabsTrigger>
        <TabsTrigger value="revenue">{t('teacherTabRevenue')}</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('teacherInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{tc('plan')}</dt>
                <dd>
                  <Badge variant="secondary">
                    {teacher?.plan === 'standard' ? 'Standard' : 'Free'}
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
                <dt className="text-muted-foreground">{tu('initialSetup')}</dt>
                <dd>
                  {teacher?.is_onboarding_complete ? (
                    <Badge className="bg-green-600 text-white hover:bg-green-700">{tc('onboardingComplete')}</Badge>
                  ) : (
                    <Badge variant="outline">{tc('onboardingIncomplete')}</Badge>
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
            <CardTitle>{tc('student')}</CardTitle>
            <CardDescription>{t('registeredStudents', { count: user.student_count ?? 0 })}</CardDescription>
          </CardHeader>
          <CardContent>
            {(user.student_count ?? 0) === 0 ? (
              <EmptyState
                icon={Users}
                title={t('noStudentsRegistered')}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('teacherHasStudents', { count: user.student_count })}
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="revenue" className="mt-4 space-y-4">
        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentRevenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.recent_payments || user.recent_payments.length === 0 ? (
              <EmptyState icon={Users} title={t('noRevenueData')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{tc('amount')}</TableHead>
                      <TableHead>{tc('status')}</TableHead>
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
            <CardTitle>{t('ticketsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.tickets || user.tickets.length === 0 ? (
              <EmptyState icon={Users} title={t('noTicketData')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t('createdAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.tickets.map((tk) => (
                      <TableRow key={tk.id}>
                        <TableCell className="font-mono text-xs">
                          {tk.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{formatDate(tk.created_at)}</TableCell>
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
  const t = useTranslations('adminUserDetail')
  const tc = useTranslations('adminCommon')
  const tu = useTranslations('adminUsers')
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">{t('guardianTabInfo')}</TabsTrigger>
        <TabsTrigger value="students-tickets">{t('guardianTabStudentsTickets')}</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('guardianInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('phone')}</dt>
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
            <CardTitle>{tu('studentList')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.students || user.students.length === 0 ? (
              <EmptyState icon={Users} title={t('linkedStudents')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{tu('grade')}</TableHead>
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
            <CardTitle>{t('paymentHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.recent_payments || user.recent_payments.length === 0 ? (
              <EmptyState icon={Users} title={t('noPaymentHistory')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{tc('amount')}</TableHead>
                      <TableHead>{tc('status')}</TableHead>
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
            <CardTitle>{t('ticketBalance')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.ticket_balances || user.ticket_balances.length === 0 ? (
              <EmptyState icon={Users} title={t('noTicketBalance')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('studentId')}</TableHead>
                      <TableHead>{t('remaining')}</TableHead>
                      <TableHead>{t('total')}</TableHead>
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
  const t = useTranslations('adminUserDetail')
  const tc = useTranslations('adminCommon')
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">{t('studentTabInfo')}</TabsTrigger>
        <TabsTrigger value="bookings">{t('studentTabBookings')}</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('studentInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('gradeLabel')}</dt>
                <dd className="font-medium">{user.student?.grade || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('memo')}</dt>
                <dd className="font-medium">{user.student?.notes || '-'}</dd>
              </div>
              {user.student_guardian && (
                <>
                  <div>
                    <dt className="text-muted-foreground">{t('guardianName')}</dt>
                    <dd className="font-medium">{user.student_guardian.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('guardianEmail')}</dt>
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
            <CardTitle>{t('recentBookings')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.recent_bookings || user.recent_bookings.length === 0 ? (
              <EmptyState icon={Users} title={t('noBookingData')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tc('dateTime')}</TableHead>
                      <TableHead>{tc('status')}</TableHead>
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
            <CardTitle>{t('assignedTeachers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!user.assigned_teachers || user.assigned_teachers.length === 0 ? (
              <EmptyState icon={Users} title={t('noAssignedTeachers')} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tc('name')}</TableHead>
                      <TableHead>{tc('email')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.assigned_teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
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
