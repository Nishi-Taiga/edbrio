"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Eye, EyeOff, Ticket } from 'lucide-react'
import { SkeletonProductCard } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { LoadingButton } from '@/components/ui/loading-button'

type TicketRow = {
  id: string
  name: string
  minutes: number
  bundle_qty: number
  price_cents: number
  valid_days: number
  is_active: boolean
  stripe_price_id: string | null
}

type TicketFormData = {
  name: string
  minutes: string
  bundle_qty: string
  price_yen: string
  valid_days: string
}

const emptyForm: TicketFormData = {
  name: '',
  minutes: '60',
  bundle_qty: '4',
  price_yen: '',
  valid_days: '30',
}

export default function TeacherTicketsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<TicketRow[]>([])

  // Dialog state
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<TicketRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TicketRow | null>(null)
  const [formData, setFormData] = useState<TicketFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchTickets = async () => {
    try {
      setError(null)
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user?.id
      if (!uid) { setItems([]); return }
      const { data, error } = await supabase
        .from('tickets')
        .select('id,name,minutes,bundle_qty,price_cents,valid_days,is_active,stripe_price_id')
        .eq('teacher_id', uid)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      setItems(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatYen = (cents: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((cents || 0) / 100)

  const openCreate = () => {
    setFormData(emptyForm)
    setShowCreate(true)
  }

  const openEdit = (ticket: TicketRow) => {
    setFormData({
      name: ticket.name,
      minutes: String(ticket.minutes),
      bundle_qty: String(ticket.bundle_qty),
      price_yen: String(ticket.price_cents / 100),
      valid_days: String(ticket.valid_days),
    })
    setEditTarget(ticket)
  }

  const handleCreate = async () => {
    if (!user || !formData.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('tickets')
        .insert({
          teacher_id: user.id,
          name: formData.name.trim(),
          minutes: parseInt(formData.minutes) || 60,
          bundle_qty: parseInt(formData.bundle_qty) || 1,
          price_cents: Math.round((parseFloat(formData.price_yen) || 0) * 100),
          valid_days: parseInt(formData.valid_days) || 30,
          is_active: true,
        })
      if (err) throw err
      setShowCreate(false)
      await fetchTickets()
      toast.success('チケットを作成しました')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error('チケットの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget || !formData.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('tickets')
        .update({
          name: formData.name.trim(),
          minutes: parseInt(formData.minutes) || 60,
          bundle_qty: parseInt(formData.bundle_qty) || 1,
          price_cents: Math.round((parseFloat(formData.price_yen) || 0) * 100),
          valid_days: parseInt(formData.valid_days) || 30,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editTarget.id)
      if (err) throw err
      setEditTarget(null)
      await fetchTickets()
      toast.success('チケットを更新しました')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error('チケットの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (ticket: TicketRow) => {
    try {
      setError(null)
      const { error: err } = await supabase
        .from('tickets')
        .update({ is_active: !ticket.is_active, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)
      if (err) throw err
      await fetchTickets()
      toast.success(ticket.is_active ? 'チケットを非公開にしました' : 'チケットを公開しました')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error('更新に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('tickets')
        .delete()
        .eq('id', deleteTarget.id)
      if (err) throw err
      setDeleteTarget(null)
      await fetchTickets()
      toast.success('チケットを削除しました')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error('チケットの削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ticket-name">チケット名 *</Label>
        <Input
          id="ticket-name"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="例: 数学90分コース"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ticket-minutes">1回の授業時間（分）</Label>
          <Input
            id="ticket-minutes"
            type="number"
            min="15"
            step="15"
            value={formData.minutes}
            onChange={e => updateField('minutes', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ticket-qty">回数</Label>
          <Input
            id="ticket-qty"
            type="number"
            min="1"
            value={formData.bundle_qty}
            onChange={e => updateField('bundle_qty', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ticket-price">価格（円）</Label>
          <Input
            id="ticket-price"
            type="number"
            min="0"
            value={formData.price_yen}
            onChange={e => updateField('price_yen', e.target.value)}
            placeholder="例: 20000"
          />
        </div>
        <div>
          <Label htmlFor="ticket-days">有効日数</Label>
          <Input
            id="ticket-days"
            type="number"
            min="1"
            value={formData.valid_days}
            onChange={e => updateField('valid_days', e.target.value)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">チケット</h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">販売するチケットの管理</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 新規チケット
          </Button>
        </div>

        {error && <ErrorAlert message={error} />}

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="チケットがありません"
            description="保護者に販売するチケットを作成しましょう"
            action={{ label: "最初のチケットを作成", onClick: openCreate }}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((t) => (
              <Card key={t.id} className={!t.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{t.name}</CardTitle>
                    <Badge variant={t.is_active ? 'default' : 'secondary'}>
                      {t.is_active ? '公開中' : '非公開'}
                    </Badge>
                  </div>
                  <CardDescription>{formatYen(t.price_cents)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1 mb-4">
                    <div>時間: {t.minutes}分 × {t.bundle_qty}回</div>
                    <div>有効期限: {t.valid_days}日</div>
                    {!t.stripe_price_id && (
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        Stripe連携未設定（オンライン決済には別途Stripe設定が必要です）
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> 編集
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(t)}>
                      {t.is_active ? (
                        <><EyeOff className="w-3.5 h-3.5 mr-1" /> 非公開</>
                      ) : (
                        <><Eye className="w-3.5 h-3.5 mr-1" /> 公開</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> 削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={v => !v && setShowCreate(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規チケット作成</DialogTitle>
              <DialogDescription>保護者に販売するチケットを作成します</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
                キャンセル
              </Button>
              <LoadingButton onClick={handleCreate} loading={saving} disabled={!formData.name.trim()}>
                作成
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>チケット編集</DialogTitle>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
                キャンセル
              </Button>
              <LoadingButton onClick={handleUpdate} loading={saving} disabled={!formData.name.trim()}>
                保存
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>チケットの削除</DialogTitle>
              <DialogDescription>
                「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
                キャンセル
              </Button>
              <LoadingButton variant="destructive" onClick={handleDelete} loading={saving}>
                削除
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
