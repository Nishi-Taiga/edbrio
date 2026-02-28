"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'

type TicketRow = {
  id: string
  teacher_id: string
  name: string
  minutes: number
  bundle_qty: number
  price_cents: number
  valid_days: number
  is_active: boolean
  stripe_price_id: string | null
  teachers?: { id: string } | null
}

type TicketBalanceRow = {
  id: string
  ticket_id: string
  remaining_minutes: number
  purchased_at: string | null
  expires_at: string | null
  tickets?: { id: string; name: string; minutes: number; bundle_qty: number } | null
}

export default function GuardianTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [balances, setBalances] = useState<TicketBalanceRow[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({})
  const [ticketNames, setTicketNames] = useState<Record<string, string>>({})

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        // Public tickets
        const { data: ts, error: tErr } = await supabase
          .from('tickets')
          .select('id,teacher_id,name,minutes,bundle_qty,price_cents,valid_days,is_active,stripe_price_id')
          .eq('is_active', true)
          .order('price_cents', { ascending: true })
        if (tErr) throw tErr
        if (mounted) setTickets(ts || [])

        // Resolve teacher names
        const teacherIds = [...new Set((ts || []).map(t => t.teacher_id))]
        if (teacherIds.length > 0) {
          const { data: teacherUsers } = await supabase
            .from('users')
            .select('id, name')
            .in('id', teacherIds)
          if (mounted && teacherUsers) {
            const nameMap: Record<string, string> = {}
            teacherUsers.forEach((u: { id: string; name: string | null }) => {
              nameMap[u.id] = u.name || u.id
            })
            setTeacherNames(nameMap)
          }
        }

        // Balances for guardian's students
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (uid) {
          const { data: students, error: sErr } = await supabase
            .from('students')
            .select('id')
            .eq('guardian_id', uid)
          if (sErr) throw sErr
          const studentIds = (students || []).map((s) => s.id)
          if (studentIds.length > 0) {
            const { data: tb, error: bErr } = await supabase
              .from('ticket_balances')
              .select('id,ticket_id,remaining_minutes,purchased_at,expires_at')
              .in('student_id', studentIds)
              .order('expires_at', { ascending: true })
            if (bErr) throw bErr
            if (mounted) setBalances(tb || [])

            // Resolve ticket names for balances
            const ticketIds = [...new Set((tb || []).map(b => b.ticket_id))]
            if (ticketIds.length > 0) {
              const { data: ticketData } = await supabase
                .from('tickets')
                .select('id, name')
                .in('id', ticketIds)
              if (mounted && ticketData) {
                const tNameMap: Record<string, string> = {}
                ticketData.forEach((t: { id: string; name: string }) => {
                  tNameMap[t.id] = t.name
                })
                setTicketNames(tNameMap)
              }
            }
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [supabase])

  const formatPrice = (priceCents: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((priceCents || 0) / 100)

  const handlePurchase = async (ticket: TicketRow) => {
    setSelectedTicket(ticket)
    setShowPurchaseDialog(true)
  }

  const handleStripeCheckout = async () => {
    if (!selectedTicket || !selectedTicket.stripe_price_id) return
    setPurchasing(true)
    try {
      const stripe = await getStripe()
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, priceId: selectedTicket.stripe_price_id }),
      })
      const data = await res.json()
      if (data.sessionId && stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (error) console.error(error.message)
      } else {
        console.error('Failed to create checkout session', data)
      }
    } finally {
      setPurchasing(false)
      setShowPurchaseDialog(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">チケット</h1>
          <p className="text-gray-600 dark:text-slate-400">チケットの購入と残高を管理します</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded text-red-700 dark:text-red-400">
            データ取得でエラーが発生しました: {error}
          </div>
        )}

        {/* Available Tickets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>購入可能なチケット</CardTitle>
            <CardDescription>先生ごとのチケット一覧</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500 dark:text-slate-400">読み込み中...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{ticket.name}</span>
                        <span className="text-brand-600 dark:text-brand-400">{formatPrice(ticket.price_cents)}</span>
                      </CardTitle>
                      <CardDescription>講師: {teacherNames[ticket.teacher_id] || ticket.teacher_id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                        <div>時間: {ticket.minutes}分 × {ticket.bundle_qty}回</div>
                        <div>有効期限: {ticket.valid_days}日</div>
                      </div>
                      <Button onClick={() => handlePurchase(ticket)} disabled={!ticket.stripe_price_id}>
                        <ShoppingCart className="w-4 h-4 mr-1" /> 購入する
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Balances */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>チケット残高</CardTitle>
            <CardDescription>保有中のチケット</CardDescription>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <div className="text-gray-500 dark:text-slate-400">チケットはありません。</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>チケット名</TableHead>
                    <TableHead>残り</TableHead>
                    <TableHead>購入日</TableHead>
                    <TableHead>有効期限</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{ticketNames[b.ticket_id] || b.ticket_id}</TableCell>
                      <TableCell>{b.remaining_minutes}分</TableCell>
                      <TableCell>{b.purchased_at ? format(new Date(b.purchased_at), 'PPP', { locale: ja }) : '-'}</TableCell>
                      <TableCell>{b.expires_at ? format(new Date(b.expires_at), 'PPP', { locale: ja }) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Purchase Dialog */}
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>チケットの購入確認</DialogTitle>
              <DialogDescription>
                {selectedTicket && (
                  <div className="text-sm text-gray-700 dark:text-slate-300">
                    <div className="font-medium">{selectedTicket.name}</div>
                    <div className="mt-1">価格: {formatPrice(selectedTicket.price_cents)}</div>
                    <div className="mt-1">時間: {selectedTicket.minutes}分 × {selectedTicket.bundle_qty}回</div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>キャンセル</Button>
              <Button onClick={handleStripeCheckout} disabled={!selectedTicket || purchasing}>
                {purchasing ? '処理中...' : '購入に進む'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

