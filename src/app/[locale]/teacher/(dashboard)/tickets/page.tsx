"use client"

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit2, Trash2, Eye, EyeOff, Ticket, Gift } from 'lucide-react'
import { SkeletonProductCard } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorAlert } from '@/components/ui/error-alert'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import { LoadingButton } from '@/components/ui/loading-button'
import { useTranslations } from 'next-intl'

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

type GrantFormData = {
  studentProfileId: string
  customMinutes: string
  customValidDays: string
  sendNotification: boolean
}

const emptyForm: TicketFormData = {
  name: '',
  minutes: '60',
  bundle_qty: '4',
  price_yen: '',
  valid_days: '30',
}

export default function TeacherTicketsPage() {
  const t = useTranslations('teacherTickets')
  const tc = useTranslations('common')
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

  // Grant state
  const [grantTarget, setGrantTarget] = useState<TicketRow | null>(null)
  const [showGrantConfirm, setShowGrantConfirm] = useState(false)
  const [grantForm, setGrantForm] = useState<GrantFormData>({
    studentProfileId: '',
    customMinutes: '',
    customValidDays: '',
    sendNotification: true,
  })
  const [granting, setGranting] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const { profiles: studentProfiles } = useStudentProfiles(user?.id)
  const linkedProfiles = useMemo(
    () => studentProfiles.filter(p => p.student_id),
    [studentProfiles]
  )

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
      toast.success(t('createSuccess'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error(t('createError'))
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
      toast.success(t('updateSuccess'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error(t('updateError'))
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
      toast.success(ticket.is_active ? t('hideSuccess') : t('showSuccess'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error(tc('updateFailed'))
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
      toast.success(t('deleteSuccess'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error(t('deleteError'))
    } finally {
      setSaving(false)
    }
  }

  // Grant handlers
  const openGrant = (ticket: TicketRow) => {
    setGrantForm({
      studentProfileId: '',
      customMinutes: String(ticket.minutes * ticket.bundle_qty),
      customValidDays: String(ticket.valid_days),
      sendNotification: true,
    })
    setGrantTarget(ticket)
  }

  const openGrantConfirm = () => {
    setGrantTarget(prev => prev) // keep grantTarget open
    setShowGrantConfirm(true)
  }

  const closeGrantConfirm = () => {
    setShowGrantConfirm(false)
  }

  const handleGrant = async () => {
    if (!grantTarget || !grantForm.studentProfileId) return
    setGranting(true)
    setError(null)
    try {
      const res = await fetch('/api/teacher/tickets/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: grantTarget.id,
          studentProfileId: grantForm.studentProfileId,
          customMinutes: parseInt(grantForm.customMinutes) || undefined,
          customValidDays: parseInt(grantForm.customValidDays) || undefined,
          sendNotification: grantForm.sendNotification,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowGrantConfirm(false)
      setGrantTarget(null)
      toast.success(t('grantSuccess'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      toast.error(t('grantError'))
    } finally {
      setGranting(false)
    }
  }

  const selectedStudentName = useMemo(() => {
    const profile = linkedProfiles.find(p => p.id === grantForm.studentProfileId)
    return profile?.name || ''
  }, [linkedProfiles, grantForm.studentProfileId])

  const updateField = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ticket-name">{t('ticketNameLabel')}</Label>
        <Input
          id="ticket-name"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder={t('ticketNamePlaceholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ticket-minutes">{t('minutesLabel')}</Label>
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
          <Label htmlFor="ticket-qty">{t('bundleQtyLabel')}</Label>
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
          <Label htmlFor="ticket-price">{t('priceLabel')}</Label>
          <Input
            id="ticket-price"
            type="number"
            min="0"
            value={formData.price_yen}
            onChange={e => updateField('price_yen', e.target.value)}
            placeholder={t('pricePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="ticket-days">{t('validDaysLabel')}</Label>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">{t('description')}</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> {t('newTicket')}
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
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            action={{ label: t('emptyAction'), onClick: openCreate }}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((ticket) => (
              <Card key={ticket.id} className={!ticket.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{ticket.name}</CardTitle>
                    <Badge variant={ticket.is_active ? 'default' : 'secondary'}>
                      {ticket.is_active ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                  <CardDescription>{formatYen(ticket.price_cents)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1 mb-4">
                    <div>{t('duration', { minutes: ticket.minutes, qty: ticket.bundle_qty })}</div>
                    <div>{t('validDays', { days: ticket.valid_days })}</div>
                    {!ticket.stripe_price_id && (
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        {t('stripeNotLinked')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(ticket)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> {t('editButton')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(ticket)}>
                      {ticket.is_active ? (
                        <><EyeOff className="w-3.5 h-3.5 mr-1" /> {t('hideButton')}</>
                      ) : (
                        <><Eye className="w-3.5 h-3.5 mr-1" /> {t('showButton')}</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openGrant(ticket)}>
                      <Gift className="w-3.5 h-3.5 mr-1" /> {t('grantButton')}
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(ticket)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> {t('deleteButton')}
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
              <DialogTitle>{t('createDialogTitle')}</DialogTitle>
              <DialogDescription>{t('createDialogDescription')}</DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
                {tc('cancel')}
              </Button>
              <LoadingButton onClick={handleCreate} loading={saving} disabled={!formData.name.trim()}>
                {tc('create')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editDialogTitle')}</DialogTitle>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
                {tc('cancel')}
              </Button>
              <LoadingButton onClick={handleUpdate} loading={saving} disabled={!formData.name.trim()}>
                {tc('save')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('deleteDialogDescription', { name: deleteTarget?.name || '' })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
                {tc('cancel')}
              </Button>
              <LoadingButton variant="destructive" onClick={handleDelete} loading={saving}>
                {tc('delete')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grant Form Dialog */}
        <Dialog open={!!grantTarget && !showGrantConfirm} onOpenChange={v => !v && setGrantTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('grantDialogTitle')}</DialogTitle>
              <DialogDescription>{t('grantDialogDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('grantStudentLabel')}</Label>
                {linkedProfiles.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    {t('grantNoLinkedStudents')}
                  </p>
                ) : (
                  <Select
                    value={grantForm.studentProfileId}
                    onValueChange={v => setGrantForm(prev => ({ ...prev, studentProfileId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('grantStudentPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedProfiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('grantMinutesLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={grantForm.customMinutes}
                    onChange={e => setGrantForm(prev => ({ ...prev, customMinutes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t('grantValidDaysLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={grantForm.customValidDays}
                    onChange={e => setGrantForm(prev => ({ ...prev, customValidDays: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="grant-notify"
                  checked={grantForm.sendNotification}
                  onCheckedChange={v => setGrantForm(prev => ({ ...prev, sendNotification: !!v }))}
                />
                <Label htmlFor="grant-notify" className="text-sm font-normal">
                  {t('grantSendNotification')}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGrantTarget(null)}>
                {tc('cancel')}
              </Button>
              <Button
                onClick={openGrantConfirm}
                disabled={!grantForm.studentProfileId || linkedProfiles.length === 0}
              >
                {tc('next')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grant Confirmation Dialog */}
        <Dialog open={showGrantConfirm} onOpenChange={v => { if (!v) closeGrantConfirm() }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('grantConfirmTitle')}</DialogTitle>
              <DialogDescription>{t('grantConfirmDescription')}</DialogDescription>
            </DialogHeader>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-gray-500 dark:text-slate-400">{t('grantConfirmTicket')}</td>
                  <td className="py-2 font-medium text-right">{grantTarget?.name}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-gray-500 dark:text-slate-400">{t('grantConfirmStudent')}</td>
                  <td className="py-2 font-medium text-right">{selectedStudentName}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-gray-500 dark:text-slate-400">{t('grantConfirmMinutes')}</td>
                  <td className="py-2 font-medium text-right">{grantForm.customMinutes}分</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-gray-500 dark:text-slate-400">{t('grantConfirmValidDays')}</td>
                  <td className="py-2 font-medium text-right">{grantForm.customValidDays}日</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500 dark:text-slate-400">{t('grantConfirmNotify')}</td>
                  <td className="py-2 font-medium text-right">
                    {grantForm.sendNotification ? t('grantNotifyYes') : t('grantNotifyNo')}
                  </td>
                </tr>
              </tbody>
            </table>
            <DialogFooter>
              <Button variant="outline" onClick={closeGrantConfirm} disabled={granting}>
                {t('grantConfirmNo')}
              </Button>
              <LoadingButton onClick={handleGrant} loading={granting}>
                {t('grantConfirmYes')}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
