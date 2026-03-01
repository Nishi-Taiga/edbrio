'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SkeletonList } from '@/components/ui/skeleton-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingButton } from '@/components/ui/loading-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/* ---------- Types ---------- */

interface TicketProduct {
  id: string
  teacher_id: string | null
  teacher_name: string | null
  name: string
  minutes: number
  quantity: number
  price_cents: number
  valid_days: number
  active: boolean
  stripe_price_id: string | null
  created_at: string
}

interface TicketBalance {
  id: string
  student_id: string | null
  ticket_id: string | null
  student_name: string | null
  ticket_name: string | null
  remaining_minutes: number
  created_at: string
  expires_at: string | null
}

interface ProductsData {
  tickets: TicketProduct[]
  total: number
  page: number
  limit: number
}

interface BalancesData {
  balances: TicketBalance[]
  total: number
  page: number
  limit: number
}

/* ---------- Formatters ---------- */

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
})

/* ---------- Helpers ---------- */

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 7
}

/* ---------- Component ---------- */

export default function AdminTicketsPage() {
  const [products, setProducts] = useState<ProductsData | null>(null)
  const [balances, setBalances] = useState<BalancesData | null>(null)
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false)
  const [balancesPage, setBalancesPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Adjustment dialog state
  const [adjustBalance, setAdjustBalance] = useState<TicketBalance | null>(null)
  const [adjMinutes, setAdjMinutes] = useState('')
  const [adjExpiry, setAdjExpiry] = useState('')
  const [adjSubmitting, setAdjSubmitting] = useState(false)
  const [adjError, setAdjError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const balancesParams = new URLSearchParams({
        type: 'balances',
        page: String(balancesPage),
      })
      if (expiringSoonOnly) balancesParams.set('expiring_soon', 'true')

      const [productsRes, balancesRes] = await Promise.all([
        fetch('/api/admin/tickets?type=products'),
        fetch(`/api/admin/tickets?${balancesParams.toString()}`),
      ])

      if (!productsRes.ok) throw new Error(`Products API returned ${productsRes.status}`)
      if (!balancesRes.ok) throw new Error(`Balances API returned ${balancesRes.status}`)

      const productsData: ProductsData = await productsRes.json()
      const balancesData: BalancesData = await balancesRes.json()

      setProducts(productsData)
      setBalances(balancesData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [expiringSoonOnly, balancesPage])

  useEffect(() => {
    load()
  }, [load])

  const handleOpenAdjust = (balance: TicketBalance) => {
    setAdjustBalance(balance)
    setAdjMinutes(String(balance.remaining_minutes))
    setAdjExpiry(balance.expires_at ? balance.expires_at.slice(0, 10) : '')
    setAdjError(null)
  }

  const handleSubmitAdjust = async () => {
    if (!adjustBalance) return
    setAdjSubmitting(true)
    setAdjError(null)
    try {
      const body: Record<string, unknown> = { balanceId: adjustBalance.id }
      if (adjMinutes !== '') body.remaining_minutes = Number(adjMinutes)
      if (adjExpiry !== '') body.expires_at = new Date(adjExpiry).toISOString()

      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `API returned ${res.status}`)
      }

      setAdjustBalance(null)
      load()
    } catch (e) {
      setAdjError(e instanceof Error ? e.message : String(e))
    } finally {
      setAdjSubmitting(false)
    }
  }

  const balancesTotalPages = balances ? Math.ceil(balances.total / balances.limit) : 0

  /* ---------- Render ---------- */

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        チケット管理
      </h1>
      <p className="text-gray-600 dark:text-slate-400 mb-8">
        チケット商品と残高管理
      </p>

      {/* Error */}
      {error && <ErrorAlert message={error} onRetry={load} />}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-8">
          <SkeletonList count={5} />
          <SkeletonList count={5} />
        </div>
      )}

      {/* Main content */}
      {!loading && !error && products && balances && (
        <>
          {/* Ticket Products */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                チケット商品一覧
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.tickets.length === 0 ? (
                <EmptyState icon={Ticket} title="チケット商品はありません" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>講師名</TableHead>
                        <TableHead>チケット名</TableHead>
                        <TableHead>分数</TableHead>
                        <TableHead>回数</TableHead>
                        <TableHead>価格</TableHead>
                        <TableHead>有効日数</TableHead>
                        <TableHead>有効</TableHead>
                        <TableHead>Stripe ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.tickets.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.teacher_name || '-'}</TableCell>
                          <TableCell>{t.name}</TableCell>
                          <TableCell>{t.minutes}</TableCell>
                          <TableCell>{t.quantity}</TableCell>
                          <TableCell>{yenFormatter.format(t.price_cents / 100)}</TableCell>
                          <TableCell>{t.valid_days}日</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                t.active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }
                            >
                              {t.active ? '有効' : '無効'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-slate-400 font-mono max-w-[120px] truncate">
                            {t.stripe_price_id || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Balances */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  チケット残高一覧
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="expiring-soon"
                    checked={expiringSoonOnly}
                    onCheckedChange={(checked) => {
                      setExpiringSoonOnly(checked === true)
                      setBalancesPage(1)
                    }}
                  />
                  <label
                    htmlFor="expiring-soon"
                    className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer"
                  >
                    期限切れ間近のみ
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {balances.balances.length === 0 ? (
                <EmptyState icon={Ticket} title="チケット残高はありません" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>生徒名</TableHead>
                          <TableHead>チケット名</TableHead>
                          <TableHead>残り分数</TableHead>
                          <TableHead>購入日</TableHead>
                          <TableHead>有効期限</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balances.balances.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.student_name || '-'}</TableCell>
                            <TableCell>{b.ticket_name || '-'}</TableCell>
                            <TableCell>{b.remaining_minutes}分</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(b.created_at), 'yyyy/MM/dd', { locale: ja })}
                            </TableCell>
                            <TableCell
                              className={`whitespace-nowrap ${
                                isExpiringSoon(b.expires_at)
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : ''
                              }`}
                            >
                              {b.expires_at
                                ? format(new Date(b.expires_at), 'yyyy/MM/dd', { locale: ja })
                                : '-'}
                              {isExpiringSoon(b.expires_at) && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                  期限間近
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAdjust(b)}
                              >
                                調整
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {balancesTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        全{balances.total}件中 {(balancesPage - 1) * balances.limit + 1}-
                        {Math.min(balancesPage * balances.limit, balances.total)}件
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={balancesPage <= 1}
                          onClick={() => setBalancesPage((p) => p - 1)}
                        >
                          前へ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={balancesPage >= balancesTotalPages}
                          onClick={() => setBalancesPage((p) => p + 1)}
                        >
                          次へ
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Adjustment Dialog */}
          <Dialog
            open={adjustBalance !== null}
            onOpenChange={(open) => { if (!open) setAdjustBalance(null) }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>チケット残高調整</DialogTitle>
                <DialogDescription>
                  {adjustBalance && (
                    <>
                      {adjustBalance.student_name || '不明'} - {adjustBalance.ticket_name || '不明'}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {adjustBalance && (
                <div className="space-y-4">
                  {adjError && <ErrorAlert message={adjError} />}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      残り分数
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={adjMinutes}
                      onChange={(e) => setAdjMinutes(e.target.value)}
                      placeholder="残り分数を入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      有効期限
                    </label>
                    <Input
                      type="date"
                      value={adjExpiry}
                      onChange={(e) => setAdjExpiry(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <LoadingButton
                      loading={adjSubmitting}
                      onClick={handleSubmitAdjust}
                    >
                      保存
                    </LoadingButton>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
