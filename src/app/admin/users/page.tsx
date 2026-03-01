'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Users } from 'lucide-react'
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
  plan?: string
}

const ROLE_LABELS: Record<string, string> = {
  all: 'すべて',
  teacher: '講師',
  guardian: '保護者',
  student: '生徒',
}

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  teacher: 'default',
  guardian: 'secondary',
  student: 'outline',
}

const LIMIT = 20

export default function AdminUsersPage() {
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('all')
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
      })
      if (role !== 'all') params.set('role', role)
      if (role === 'teacher' && plan !== 'all') params.set('plan', plan)
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
  }, [page, role, plan, search, sort])

  // Debounced search: reset page and refetch after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [role, plan, sort])

  // Reset plan filter when role changes away from teacher
  useEffect(() => {
    if (role !== 'teacher') {
      setPlan('all')
    }
  }, [role])

  // Fetch on page/filter changes
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const from = (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, total)
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ユーザー管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="名前・メールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="ロール" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="teacher">講師</SelectItem>
                <SelectItem value="guardian">保護者</SelectItem>
                <SelectItem value="student">生徒</SelectItem>
              </SelectContent>
            </Select>

            {role === 'teacher' && (
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="プラン" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Standard</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">新しい順</SelectItem>
                <SelectItem value="oldest">古い順</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && <ErrorAlert message={error} onRetry={fetchUsers} />}

          {/* Loading */}
          {loading && <SkeletonList count={5} />}

          {/* Empty state */}
          {!loading && !error && users.length === 0 && (
            <EmptyState
              icon={Users}
              title="ユーザーが見つかりません"
              description="検索条件を変更してください。"
            />
          )}

          {/* Table */}
          {!loading && !error && users.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead>メール</TableHead>
                      <TableHead>ロール</TableHead>
                      <TableHead>プラン</TableHead>
                      <TableHead>登録日</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'outline'}>
                            {ROLE_LABELS[user.role] ?? user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'teacher' && user.plan ? (
                            <Badge variant="secondary">
                              {user.plan === 'pro' ? 'Standard' : 'Free'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'PPP', { locale: ja })}
                        </TableCell>
                        <TableCell>
                          {user.is_suspended ? (
                            <Badge variant="destructive">停止中</Badge>
                          ) : (
                            <Badge className="bg-green-600 text-white hover:bg-green-700">
                              有効
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {total}件中 {from}-{to}件
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    次へ
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
