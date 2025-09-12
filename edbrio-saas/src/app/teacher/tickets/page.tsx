'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, EyeOff, CreditCard, Clock } from 'lucide-react'

interface TicketType {
  id: string
  name: string
  minutes: number
  bundleQty: number
  priceCents: number
  validDays: number
  isActive: boolean
  stripePriceId?: string
}

export default function TeacherTickets() {
  const [tickets, setTickets] = useState<TicketType[]>([
    {
      id: '1',
      name: '単発授業チケット',
      minutes: 60,
      bundleQty: 1,
      priceCents: 500000, // ¥5,000
      validDays: 30,
      isActive: true,
      stripePriceId: 'price_1234567890',
    },
    {
      id: '2',
      name: '5回パック',
      minutes: 60,
      bundleQty: 5,
      priceCents: 2250000, // ¥22,500 (10% discount)
      validDays: 90,
      isActive: true,
    },
    {
      id: '3',
      name: '10回パック',
      minutes: 60,
      bundleQty: 10,
      priceCents: 4000000, // ¥40,000 (20% discount)
      validDays: 180,
      isActive: false,
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [newTicket, setNewTicket] = useState({
    name: '',
    minutes: 60,
    bundleQty: 1,
    price: '',
    validDays: 30,
  })

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(priceCents / 100)
  }

  const calculateUnitPrice = (priceCents: number, bundleQty: number) => {
    const unitPrice = priceCents / bundleQty / 100
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(unitPrice)
  }

  const handleCreateTicket = () => {
    if (!newTicket.name || !newTicket.price) return

    const ticket: TicketType = {
      id: Date.now().toString(),
      name: newTicket.name,
      minutes: newTicket.minutes,
      bundleQty: newTicket.bundleQty,
      priceCents: Math.round(parseFloat(newTicket.price) * 100),
      validDays: newTicket.validDays,
      isActive: false, // Start as inactive
    }

    setTickets(prev => [...prev, ticket])
    setIsCreating(false)
    setNewTicket({
      name: '',
      minutes: 60,
      bundleQty: 1,
      price: '',
      validDays: 30,
    })
  }

  const toggleTicketStatus = (ticketId: string) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, isActive: !ticket.isActive }
        : ticket
    ))
  }

  const deleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(ticket => ticket.id !== ticketId))
  }

  const getBundleDiscount = (bundleQty: number, priceCents: number) => {
    if (bundleQty === 1) return null
    
    // Assuming single ticket is ¥5,000
    const singlePrice = 500000
    const totalSinglePrice = singlePrice * bundleQty
    const discount = ((totalSinglePrice - priceCents) / totalSinglePrice) * 100
    
    return discount > 0 ? Math.round(discount) : null
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">チケット管理</h1>
          <p className="text-gray-600">授業に使用するチケットの価格と設定を管理します</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>チケット一覧</CardTitle>
                  <CardDescription>作成済みのチケットタイプを管理できます</CardDescription>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新規作成
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>チケット名</TableHead>
                      <TableHead>授業時間</TableHead>
                      <TableHead>回数</TableHead>
                      <TableHead>価格</TableHead>
                      <TableHead>単価</TableHead>
                      <TableHead>有効期限</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => {
                      const discount = getBundleDiscount(ticket.bundleQty, ticket.priceCents)
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.name}</div>
                              {discount && (
                                <Badge variant="secondary" className="text-xs mt-1 bg-green-100 text-green-800">
                                  {discount}% OFF
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-gray-500" />
                              {ticket.minutes}分
                            </div>
                          </TableCell>
                          <TableCell>{ticket.bundleQty}回</TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(ticket.priceCents)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {calculateUnitPrice(ticket.priceCents, ticket.bundleQty)}
                          </TableCell>
                          <TableCell>{ticket.validDays}日間</TableCell>
                          <TableCell>
                            {ticket.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">公開中</Badge>
                            ) : (
                              <Badge variant="secondary">非公開</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleTicketStatus(ticket.id)}
                              >
                                {ticket.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTicket(ticket)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteTicket(ticket.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {tickets.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      チケットがありません
                    </h3>
                    <p className="text-gray-500 mb-4">
                      最初のチケットを作成して、生徒からの予約を受け付けましょう
                    </p>
                    <Button onClick={() => setIsCreating(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      チケットを作成
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">総チケット数</span>
                    <span className="font-semibold">{tickets.length}種類</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">公開中</span>
                    <span className="font-semibold text-green-600">
                      {tickets.filter(t => t.isActive).length}種類
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">平均単価</span>
                    <span className="font-semibold">
                      {formatPrice(
                        tickets.length > 0 
                          ? tickets.reduce((sum, t) => sum + (t.priceCents / t.bundleQty), 0) / tickets.length
                          : 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Tips */}
            <Card>
              <CardHeader>
                <CardTitle>価格設定のコツ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>まとめ割引:</strong> 複数回パックには10-20%の割引を設定
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>有効期限:</strong> 単発は30日、パックは90-180日が一般的
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong>競合調査:</strong> 同じ科目・レベルの講師の価格を参考に
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Integration */}
            <Card>
              <CardHeader>
                <CardTitle>Stripe連携</CardTitle>
                <CardDescription>決済を受け付けるための設定</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-sm text-orange-800">
                      <strong>設定が必要です</strong><br/>
                      Stripeアカウントを連携して決済を有効化してください
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    Stripe連携を設定
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle>テンプレート</CardTitle>
                <CardDescription>よく使われる価格設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-left justify-start"
                  onClick={() => {
                    setNewTicket({
                      name: '高校生向け数学',
                      minutes: 60,
                      bundleQty: 1,
                      price: '5000',
                      validDays: 30,
                    })
                    setIsCreating(true)
                  }}
                >
                  <div>
                    <div className="font-medium">高校生向け</div>
                    <div className="text-xs text-gray-600">¥5,000 / 60分</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-left justify-start"
                  onClick={() => {
                    setNewTicket({
                      name: '中学生向け英語',
                      minutes: 60,
                      bundleQty: 1,
                      price: '4000',
                      validDays: 30,
                    })
                    setIsCreating(true)
                  }}
                >
                  <div>
                    <div className="font-medium">中学生向け</div>
                    <div className="text-xs text-gray-600">¥4,000 / 60分</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Ticket Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいチケットを作成</DialogTitle>
              <DialogDescription>
                授業で使用するチケットの詳細を設定してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-name">チケット名</Label>
                <Input
                  id="ticket-name"
                  placeholder="例: 高校数学 個別指導"
                  value={newTicket.name}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minutes">授業時間（分）</Label>
                  <Select
                    value={newTicket.minutes.toString()}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, minutes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30分</SelectItem>
                      <SelectItem value="45">45分</SelectItem>
                      <SelectItem value="60">60分</SelectItem>
                      <SelectItem value="90">90分</SelectItem>
                      <SelectItem value="120">120分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bundle">回数</Label>
                  <Select
                    value={newTicket.bundleQty.toString()}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, bundleQty: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1回（単発）</SelectItem>
                      <SelectItem value="3">3回パック</SelectItem>
                      <SelectItem value="5">5回パック</SelectItem>
                      <SelectItem value="10">10回パック</SelectItem>
                      <SelectItem value="20">20回パック</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">価格（円）</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="5000"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, price: e.target.value }))}
                  />
                  {newTicket.price && newTicket.bundleQty > 1 && (
                    <div className="text-xs text-gray-600">
                      単価: {calculateUnitPrice(parseFloat(newTicket.price) * 100, newTicket.bundleQty)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid-days">有効期限（日）</Label>
                  <Select
                    value={newTicket.validDays.toString()}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, validDays: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7日間</SelectItem>
                      <SelectItem value="30">30日間</SelectItem>
                      <SelectItem value="60">60日間</SelectItem>
                      <SelectItem value="90">90日間</SelectItem>
                      <SelectItem value="180">180日間</SelectItem>
                      <SelectItem value="365">365日間</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateTicket}>
                  チケットを作成
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}