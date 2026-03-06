import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserDetail } from '@/lib/admin/queries'
import { Booking, Payment, Report } from '@/lib/types/database'
import { SuspendButton } from './suspend-button'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params
  const { user, teacher, guardian, bookings, payments, reports } = await getUserDetail(userId)

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">ユーザーが見つかりません。</p>
        <Link href="/admin/users">
          <Button variant="outline" className="mt-4">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">← 一覧に戻る</Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name || user.email}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">プロフィール</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="font-mono text-xs break-all">{user.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">名前</dt>
                <dd>{user.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">メール</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">ロール</dt>
                <dd><Badge>{user.role}</Badge></dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">登録日</dt>
                <dd>{new Date(user.created_at).toLocaleDateString('ja-JP')}</dd>
              </div>
            </dl>

            {/* Role-specific data */}
            {teacher && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">講師情報</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">科目</dt>
                    <dd>{teacher.subjects?.join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">プラン</dt>
                    <dd><Badge variant={teacher.plan === 'pro' ? 'default' : 'secondary'}>{teacher.plan}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Stripe連携</dt>
                    <dd>{teacher.stripe_account_id ? '連携済み' : '未連携'}</dd>
                  </div>
                </dl>
              </div>
            )}

            {guardian && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">保護者情報</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">電話番号</dt>
                    <dd>{guardian.phone || '—'}</dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="mt-6">
              <SuspendButton userId={user.id} />
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近の予約</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-500">予約はありません。</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b: Booking) => (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <span>{new Date(b.start_time).toLocaleString('ja-JP')}</span>
                      <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近の決済</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500">決済はありません。</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p: Payment) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <span>{new Date(p.created_at).toLocaleDateString('ja-JP')}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(p.amount_cents / 100)}
                        </span>
                        <Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近のレポート</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-sm text-gray-500">レポートはありません。</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((r: Report) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div>
                        <span>{r.subject || '—'}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          {new Date(r.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <Badge variant={r.visibility === 'published' ? 'default' : 'secondary'}>{r.visibility}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
