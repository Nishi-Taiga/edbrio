'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Users, GraduationCap, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'teacher' | 'guardian' | 'student'
  created_at: string
  is_suspended: boolean
  // Teacher
  plan?: string
  subjects?: string[]
  is_onboarding_complete?: boolean
  student_count?: number
  // Student
  grade?: string | null
  guardian_name?: string | null
  teacher_count?: number
}

const LIMIT = 20

export default function AdminUsersPage() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('teacher')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [plan, setPlan] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sort,
        role: activeTab,
      })
      if (activeTab === 'teacher' && plan !== 'all') params.set('plan', plan)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'ユーザーの取得に失敗しました。')
      }

      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, plan, search, sort])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page & plan when tab or sort changes
  useEffect(() => {
    setPage(1)
    setPlan('all')
    setSearch('')
  }, [activeTab])

  useEffect(() => {
    setPage(1)
  }, [sort])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const from = (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, total)
  const totalPages = Math.ceil(total / LIMIT)

  const statusBadge = (user: AdminUser) =>
    user.is_suspended ? (
      <Badge variant="destructive">停止中</Badge>
    ) : (
      <Badge className="bg-green-600 text-white hover:bg-green-700">有効</Badge>
    )

  const pagination = total > LIMIT && (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        {total}件中 {from}-{to}件
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          前へ
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          次へ
        </Button>
      </div>
    </div>
  )

  const renderLoadingOrEmpty = (icon: typeof Users, emptyTitle: string) => (
    <>
      {error && <ErrorAlert message={error} onRetry={fetchUsers} />}
      {loading && <SkeletonList count={5} />}
      {!loading && !error && users.length === 0 && (
        <EmptyState icon={icon} title={emptyTitle} description="検索条件を変更してください。" />
      )}
    </>
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">ユーザー管理</h1>
        <p className="text-gray-600 dark:text-slate-400">講師・保護者・生徒の一覧と管理</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="teacher">講師</TabsTrigger>
          <TabsTrigger value="guardian">保護者</TabsTrigger>
          <TabsTrigger value="student">生徒</TabsTrigger>
        </TabsList>

        {/* ── 講師一覧 ── */}
        <TabsContent value="teacher">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">講師一覧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input placeholder="名前・メールで検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
                <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1) }}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="プラン" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Standard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="並び替え" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">新しい順</SelectItem>
                    <SelectItem value="oldest">古い順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderLoadingOrEmpty(Users, '講師が見つかりません')}

              {!loading && !error && users.length > 0 && (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>名前</TableHead>
                          <TableHead>メール</TableHead>
                          <TableHead>プラン</TableHead>
                          <TableHead>科目</TableHead>
                          <TableHead>生徒数</TableHead>
                          <TableHead>初期設定</TableHead>
                          <TableHead>登録日</TableHead>
                          <TableHead>ステータス</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/users/${user.id}`)}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'}>
                                {user.plan === 'pro' ? 'Standard' : 'Free'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(user.subjects || []).slice(0, 3).map((s) => (
                                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                ))}
                                {(user.subjects || []).length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{(user.subjects || []).length - 3}</span>
                                )}
                                {(user.subjects || []).length === 0 && <span className="text-muted-foreground">-</span>}
                              </div>
                            </TableCell>
                            <TableCell>{user.student_count ?? 0}名</TableCell>
                            <TableCell>
                              {user.is_onboarding_complete ? (
                                <Badge className="bg-green-600 text-white hover:bg-green-700">完了</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">未完了</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{format(new Date(user.created_at), 'PPP', { locale: ja })}</TableCell>
                            <TableCell>{statusBadge(user)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 保護者一覧 ── */}
        <TabsContent value="guardian">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">保護者一覧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input placeholder="名前・メールで検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="並び替え" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">新しい順</SelectItem>
                    <SelectItem value="oldest">古い順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderLoadingOrEmpty(ShieldCheck, '保護者が見つかりません')}

              {!loading && !error && users.length > 0 && (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>名前</TableHead>
                          <TableHead>メール</TableHead>
                          <TableHead>生徒数</TableHead>
                          <TableHead>登録日</TableHead>
                          <TableHead>ステータス</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/users/${user.id}`)}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>{user.student_count ?? 0}名</TableCell>
                            <TableCell className="text-sm">{format(new Date(user.created_at), 'PPP', { locale: ja })}</TableCell>
                            <TableCell>{statusBadge(user)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 生徒一覧 ── */}
        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">生徒一覧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input placeholder="名前・メールで検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="並び替え" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">新しい順</SelectItem>
                    <SelectItem value="oldest">古い順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderLoadingOrEmpty(GraduationCap, '生徒が見つかりません')}

              {!loading && !error && users.length > 0 && (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>名前</TableHead>
                          <TableHead>メール</TableHead>
                          <TableHead>学年</TableHead>
                          <TableHead>保護者</TableHead>
                          <TableHead>担当講師数</TableHead>
                          <TableHead>登録日</TableHead>
                          <TableHead>ステータス</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/users/${user.id}`)}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>{user.grade || <span className="text-muted-foreground">-</span>}</TableCell>
                            <TableCell>{user.guardian_name || <span className="text-muted-foreground">-</span>}</TableCell>
                            <TableCell>{user.teacher_count ?? 0}名</TableCell>
                            <TableCell className="text-sm">{format(new Date(user.created_at), 'PPP', { locale: ja })}</TableCell>
                            <TableCell>{statusBadge(user)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
