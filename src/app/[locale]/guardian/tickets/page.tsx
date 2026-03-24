"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ShoppingCart } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'
import { LoadingButton } from '@/components/ui/loading-button'
import { SkeletonProductCard } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { getRemainingSessionCount } from '@/lib/utils/ticket'
import { trackEvent } from '@/lib/analytics'

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
  student_id: string
  remaining_minutes: number
  purchased_at: string | null
  expires_at: string | null
  tickets?: { id: string; name: string; minutes: number; bundle_qty: number } | null
}

export default function GuardianTickets() {
  const t = useTranslations('guardianTickets')
  const tc = useTranslations('common')
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [balances, setBalances] = useState<TicketBalanceRow[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({})
  const [ticketNames, setTicketNames] = useState<Record<string, string>>({})
  const [ticketMinutesMap, setTicketMinutesMap] = useState<Record<string, number>>({})
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [filterStudent, setFilterStudent] = useState<string>('all')

  const supabase = useMemo(() => createClient(), [])
  const purchaseTracked = useRef(false)

  // Track ticket_purchase conversion on Stripe checkout success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true' && !purchaseTracked.current) {
      purchaseTracked.current = true
      trackEvent({ name: 'ticket_purchase', params: { ticket_id: params.get('session_id') || '' } })
    }
  }, [])

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
              .select('id,ticket_id,student_id,remaining_minutes,purchased_at,expires_at')
              .in('student_id', studentIds)
              .order('expires_at', { ascending: true })
            if (bErr) throw bErr
            if (mounted) setBalances(tb || [])

            // Resolve student names
            if (studentIds.length > 1) {
              const { data: sUsers } = await supabase
                .from('users')
                .select('id, name')
                .in('id', studentIds)
              if (mounted && sUsers) {
                const sMap: Record<string, string> = {}
                sUsers.forEach((u: { id: string; name: string }) => { sMap[u.id] = u.name })
                setStudentNames(sMap)
              }
            }

            // Resolve ticket names for balances
            const ticketIds = [...new Set((tb || []).map(b => b.ticket_id))]
            if (ticketIds.length > 0) {
              const { data: ticketData } = await supabase
                .from('tickets')
                .select('id, name, minutes')
                .in('id', ticketIds)
              if (mounted && ticketData) {
                const tNameMap: Record<string, string> = {}
                const tMinutesMap: Record<string, number> = {}
                ticketData.forEach((t: { id: string; name: string; minutes: number }) => {
                  tNameMap[t.id] = t.name
                  tMinutesMap[t.id] = t.minutes
                })
                setTicketNames(tNameMap)
                setTicketMinutesMap(tMinutesMap)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-gray-600 dark:text-slate-400">{t('description')}</p>
        </div>

        {error && <ErrorAlert message={tc('dataFetchError', { error })} />}

        {/* Available Tickets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('availableTickets')}</CardTitle>
            <CardDescription>{t('availableTicketsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => <SkeletonProductCard key={i} />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{ticket.name}</span>
                        <span className="text-brand-600 dark:text-brand-400">{formatPrice(ticket.price_cents)}</span>
                      </CardTitle>
                      <CardDescription>{t('teacherLabel', { name: teacherNames[ticket.teacher_id] || tc('teacher') })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                        <div>{t('duration', { minutes: ticket.minutes, qty: ticket.bundle_qty })}</div>
                        <div>{t('validDays', { days: ticket.valid_days })}</div>
                      </div>
                      <Button onClick={() => handlePurchase(ticket)} disabled={!ticket.stripe_price_id}>
                        <ShoppingCart className="w-4 h-4 mr-1" /> {t('purchaseButton')}
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{t('balanceTitle')}</CardTitle>
                <CardDescription>{t('balanceDesc')}</CardDescription>
              </div>
              {Object.keys(studentNames).length > 1 && (
                <div className="w-full sm:w-48">
                  <Select value={filterStudent} onValueChange={setFilterStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('filterStudent')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filterAllStudents')}</SelectItem>
                      {Object.entries(studentNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title={t('emptyBalance')}
                description={t('emptyBalanceDescription')}
              />
            ) : (() => {
              const filteredBalances = filterStudent === 'all' ? balances : balances.filter(b => b.student_id === filterStudent)
              return filteredBalances.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">{t('noFilterResults')}</div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(studentNames).length > 1 && <TableHead>{t('tableStudent')}</TableHead>}
                    <TableHead>{t('tableTicketName')}</TableHead>
                    <TableHead>{t('tableRemaining')}</TableHead>
                    <TableHead>{t('tablePurchaseDate')}</TableHead>
                    <TableHead>{t('tableExpiry')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((b) => {
                    const daysLeft = b.expires_at ? differenceInDays(new Date(b.expires_at), new Date()) : null
                    const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
                    return (
                    <TableRow key={b.id} className={isExpiringSoon ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                      {Object.keys(studentNames).length > 1 && (
                        <TableCell className="font-medium">{studentNames[b.student_id] || '-'}</TableCell>
                      )}
                      <TableCell>{ticketNames[b.ticket_id] || b.ticket_id}</TableCell>
                      <TableCell>
                        {(() => {
                          const mins = ticketMinutesMap[b.ticket_id]
                          const count = mins != null ? getRemainingSessionCount(b.remaining_minutes, mins) : null
                          return count != null
                            ? t('remainingWithCount', { count, minutes: b.remaining_minutes })
                            : `${b.remaining_minutes}${tc('minutes')}`
                        })()}
                      </TableCell>
                      <TableCell>{b.purchased_at ? format(new Date(b.purchased_at), 'PPP', { locale: ja }) : '-'}</TableCell>
                      <TableCell>
                        <span className={isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                          {b.expires_at ? format(new Date(b.expires_at), 'PPP', { locale: ja }) : '-'}
                        </span>
                        {isExpiringSoon && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            {t('daysRemaining', { days: daysLeft })}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              )
            })()}
          </CardContent>
        </Card>

        {/* Purchase Dialog */}
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('purchaseConfirmTitle')}</DialogTitle>
              <DialogDescription>
                {selectedTicket && (
                  <div className="text-sm text-gray-700 dark:text-slate-300">
                    <div className="font-medium">{selectedTicket.name}</div>
                    <div className="mt-1">{t('priceLabel', { price: formatPrice(selectedTicket.price_cents) })}</div>
                    <div className="mt-1">{t('durationLabel', { minutes: selectedTicket.minutes, qty: selectedTicket.bundle_qty })}</div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>{tc('cancel')}</Button>
              <LoadingButton onClick={handleStripeCheckout} disabled={!selectedTicket} loading={purchasing}>
                {t('proceedPurchase')}
              </LoadingButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

