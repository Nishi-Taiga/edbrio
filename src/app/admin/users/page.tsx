import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUsers } from '@/lib/admin/queries'
import { UserFilters } from './user-filters'

interface Props {
  searchParams: Promise<{ role?: string; plan?: string; search?: string; page?: string }>
}

const roleBadge: Record<string, { label: string; className: string }> = {
  teacher: { label: '講師', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  guardian: { label: '保護者', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  student: { label: '生徒', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
}

const planBadge: Record<string, { label: string; className: string }> = {
  pro: { label: 'Pro', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  free: { label: 'Free', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const perPage = 20
  const { users, total } = await getUsers({
    role: params.role,
    plan: params.plan,
    search: params.search,
    page,
    perPage,
  })

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ユーザー管理</h1>
        <p className="text-gray-600 dark:text-slate-400">全ユーザーの一覧と管理</p>
      </div>

      <UserFilters role={params.role} plan={params.plan} search={params.search} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ユーザー一覧（{total}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">名前</th>
                  <th className="pb-2 pr-4">メール</th>
                  <th className="pb-2 pr-4">ロール</th>
                  <th className="pb-2 pr-4">プラン</th>
                  <th className="pb-2 pr-4">登録日</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      ユーザーが見つかりません。
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => {
                    const role = roleBadge[u.role] || { label: u.role, className: '' }
                    const teacherPlan = u.teachers?.[0]?.plan || (u.role === 'teacher' ? 'free' : null)
                    const plan = teacherPlan ? planBadge[teacherPlan] || planBadge.free : null

                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{u.name || '—'}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                        <td className="py-3 pr-4">
                          <Badge className={role.className}>{role.label}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {plan ? <Badge className={plan.className}>{plan.label}</Badge> : '—'}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          {new Date(u.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="py-3">
                          <Link href={`/admin/users/${u.id}`}>
                            <Button variant="outline" size="sm">詳細</Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link href={`/admin/users?${buildQuery(params, page - 1)}`}>
                  <Button variant="outline" size="sm">前へ</Button>
                </Link>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/admin/users?${buildQuery(params, page + 1)}`}>
                  <Button variant="outline" size="sm">次へ</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function buildQuery(params: Record<string, string | undefined>, page: number) {
  const q = new URLSearchParams()
  if (params.role) q.set('role', params.role)
  if (params.plan) q.set('plan', params.plan)
  if (params.search) q.set('search', params.search)
  q.set('page', String(page))
  return q.toString()
}
