'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, Clock, Calendar, ShoppingCart, Download, Star } from 'lucide-react'
import { getStripe } from '@/lib/stripe'

interface Teacher {
  id: string
  name: string
  subjects: string[]
  rating: number
  reviewCount: number
}

interface TicketType {
  id: string
  teacherId: string
  teacher: Teacher
  name: string
  minutes: number
  bundleQty: number
  priceCents: number
  validDays: number
  stripePriceId: string
  discount?: number
}

interface TicketBalance {
  id: string
  ticketId: string
  ticketName: string
  teacherName: string
  remainingMinutes: number
  purchasedAt: string
  expiresAt: string
  originalMinutes: number
}

interface PurchaseHistory {
  id: string
  ticketName: string
  teacherName: string
  amount: number
  purchasedAt: string
  status: 'completed' | 'pending' | 'failed'
}

export default function GuardianTickets() {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  // Mock data
  const teachers: Teacher[] = [
    {
      id: '1',
      name: '田中一郎',
      subjects: ['数学', '物理'],
      rating: 4.8,
      reviewCount: 24,
    },
    {
      id: '2',
      name: '佐藤花子',
      subjects: ['英語', '国語'],
      rating: 4.6,
      reviewCount: 18,
    },
    {
      id: '3',
      name: '鈴木健太',
      subjects: ['国語', '社会'],
      rating: 4.9,
      reviewCount: 31,
    },
  ]

  const availableTickets: TicketType[] = [
    {
      id: '1',
      teacherId: '1',
      teacher: teachers[0],
      name: '数学 単発授業',
      minutes: 60,
      bundleQty: 1,
      priceCents: 500000,
      validDays: 30,
      stripePriceId: 'price_1234567890',
    },
    {
      id: '2',
      teacherId: '1',
      teacher: teachers[0],
      name: '数学 5回パック',
      minutes: 60,
      bundleQty: 5,
      priceCents: 2250000,
      validDays: 90,
      stripePriceId: 'price_1234567891',
      discount: 10,
    },
    {
      id: '3',
      teacherId: '2',
      teacher: teachers[1],
      name: '英語 単発授業',
      minutes: 60,
      bundleQty: 1,
      priceCents: 450000,
      validDays: 30,
      stripePriceId: 'price_1234567892',
    },
    {
      id: '4',
      teacherId: '2',
      teacher: teachers[1],
      name: '英語 10回パック',
      minutes: 60,
      bundleQty: 10,
      priceCents: 4050000,
      validDays: 180,
      stripePriceId: 'price_1234567893',
      discount: 15,
    },
  ]

  const ticketBalances: TicketBalance[] = [
    {
      id: '1',
      ticketId: '1',
      ticketName: '数学 5回パック',
      teacherName: '田中一郎',
      remainingMinutes: 240,
      purchasedAt: '2024-09-01',
      expiresAt: '2024-11-30',
      originalMinutes: 300,
    },
    {
      id: '2',
      ticketId: '3',
      ticketName: '英語 単発授業',
      teacherName: '佐藤花子',
      remainingMinutes: 60,
      purchasedAt: '2024-09-10',
      expiresAt: '2024-10-10',
      originalMinutes: 60,
    },
  ]

  const purchaseHistory: PurchaseHistory[] = [
    {
      id: '1',
      ticketName: '数学 5回パック',
      teacherName: '田中一郎',
      amount: 22500,
      purchasedAt: '2024-09-01',
      status: 'completed',
    },
    {
      id: '2',
      ticketName: '英語 単発授業',
      teacherName: '佐藤花子',
      amount: 4500,
      purchasedAt: '2024-09-10',
      status: 'completed',
    },
  ]

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(priceCents / 100)
  }

  const calculateUnitPrice = (priceCents: number, bundleQty: number) => {
    return formatPrice(priceCents / bundleQty)
  }

  const getUsagePercentage = (remaining: number, original: number) => {
    return Math.round(((original - remaining) / original) * 100)
  }

  const handlePurchase = async (ticket: TicketType) => {
    setSelectedTicket(ticket)
    setShowPurchaseDialog(true)
  }

  const handleStripeCheckout = async () => {
    if (!selectedTicket) return
    
    setPurchasing(true)
    
    try {
      // In real app, call your API to create Stripe session
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          priceId: selectedTicket.stripePriceId,
        }),
      })

      const { sessionId } = await response.json()
      const stripe = await getStripe()
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Checkout error:', error)
      // Show error message
    } finally {
      setPurchasing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">完了</Badge>
      case 'pending':
        return <Badge variant="secondary">処理中</Badge>
      case 'failed':
        return <Badge variant="destructive">失敗</Badge>
    }
  }

  return (
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">チケット管理</h1>
          <p className="text-gray-600">授業チケットの残高確認と購入ができます</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Current Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  保有チケット
                </CardTitle>
                <CardDescription>現在利用可能なチケットの残高</CardDescription>
              </CardHeader>
              <CardContent>
                {ticketBalances.length > 0 ? (
                  <div className="space-y-4">
                    {ticketBalances.map(balance => {
                      const usagePercentage = getUsagePercentage(balance.remainingMinutes, balance.originalMinutes)
                      const hoursRemaining = Math.floor(balance.remainingMinutes / 60)
                      const minutesRemaining = balance.remainingMinutes % 60
                      
                      return (
                        <div key={balance.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{balance.ticketName}</h3>
                              <p className="text-sm text-gray-600">{balance.teacherName}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-lg">
                                {hoursRemaining}h {minutesRemaining}m
                              </div>
                              <div className="text-sm text-gray-600">
                                残り時間
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${100 - usagePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>購入日: {balance.purchasedAt}</span>
                            <span>有効期限: {balance.expiresAt}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      チケットがありません
                    </h3>
                    <p className="text-gray-500 mb-4">
                      授業を受けるためにチケットを購入しましょう
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>チケット購入</CardTitle>
                <CardDescription>利用可能なチケットから選択して購入できます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {availableTickets.map(ticket => (
                    <div key={ticket.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{ticket.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span>{ticket.teacher.name}</span>
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-3 h-3 mr-1" />
                              <span>{ticket.teacher.rating}</span>
                            </div>
                          </div>
                        </div>
                        {ticket.discount && (
                          <Badge className="bg-red-100 text-red-800">
                            {ticket.discount}% OFF
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            授業時間
                          </span>
                          <span>{ticket.minutes}分 × {ticket.bundleQty}回</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            有効期限
                          </span>
                          <span>{ticket.validDays}日間</span>
                        </div>
                        {ticket.bundleQty > 1 && (
                          <div className="flex items-center justify-between text-sm">
                            <span>単価</span>
                            <span>{calculateUnitPrice(ticket.priceCents, ticket.bundleQty)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">
                          {formatPrice(ticket.priceCents)}
                        </div>
                        <Button 
                          onClick={() => handlePurchase(ticket)}
                          className="flex items-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          購入
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Purchase History */}
            <Card>
              <CardHeader>
                <CardTitle>購入履歴</CardTitle>
                <CardDescription>過去のチケット購入記録</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>チケット</TableHead>
                      <TableHead>講師</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>購入日</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map(purchase => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.ticketName}
                        </TableCell>
                        <TableCell>{purchase.teacherName}</TableCell>
                        <TableCell>{formatPrice(purchase.amount * 100)}</TableCell>
                        <TableCell>{purchase.purchasedAt}</TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            領収書
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>残高サマリー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">保有チケット</span>
                    <span className="font-semibold">{ticketBalances.length}種類</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">総残り時間</span>
                    <span className="font-semibold">
                      {Math.floor(ticketBalances.reduce((sum, b) => sum + b.remainingMinutes, 0) / 60)}時間
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">今月の購入額</span>
                    <span className="font-semibold">
                      {formatPrice(purchaseHistory.reduce((sum, p) => sum + p.amount, 0) * 100)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>チケット活用のコツ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>まとめ買い:</strong> 複数回パックは単価がお得
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>有効期限:</strong> 購入前に必ず確認しましょう
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>計画的利用:</strong> 定期的な授業スケジュールを立てることをおすすめ
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>サポート</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  よくある質問
                </Button>
                <Button variant="outline" className="w-full">
                  お問い合わせ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Purchase Confirmation Dialog */}
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>チケット購入の確認</DialogTitle>
              <DialogDescription>
                以下のチケットを購入しますか？
              </DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">チケット名</span>
                      <span>{selectedTicket.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">講師</span>
                      <span>{selectedTicket.teacher.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">授業時間</span>
                      <span>{selectedTicket.minutes}分 × {selectedTicket.bundleQty}回</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">有効期限</span>
                      <span>{selectedTicket.validDays}日間</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>合計金額</span>
                      <span>{formatPrice(selectedTicket.priceCents)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  ※ お支払いはStripeを通じて安全に処理されます<br/>
                  ※ 購入後のキャンセル・返金はできませんのでご注意ください
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPurchaseDialog(false)}
                    disabled={purchasing}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={handleStripeCheckout}
                    disabled={purchasing}
                  >
                    {purchasing ? '処理中...' : 'Stripeで決済'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}