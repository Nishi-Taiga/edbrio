'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'

interface InviteParentDialogProps {
  open: boolean
  onClose: () => void
  profileId: string
  studentName: string
}

interface InviteStatus {
  email: string
  used: boolean
  accepted_at?: string
}

export function InviteParentDialog({ open, onClose, profileId, studentName }: InviteParentDialogProps) {
  const t = useTranslations('invite')
  const tc = useTranslations('common')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [existingInvite, setExistingInvite] = useState<InviteStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Check existing invite status when dialog opens
  useEffect(() => {
    if (!open || !profileId) return
    let mounted = true

    async function checkExisting() {
      setLoadingStatus(true)
      try {
        const { data } = await supabase
          .from('invites')
          .select('email, used, accepted_at')
          .eq('student_profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (mounted && data) {
          setExistingInvite(data)
        }
      } catch {
        // Ignore errors
      } finally {
        if (mounted) setLoadingStatus(false)
      }
    }

    checkExisting()
    return () => { mounted = false }
  }, [open, profileId, supabase])

  const handleSubmit = async () => {
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), studentProfileId: profileId }),
      })

      if (res.status === 409) {
        toast.error(t('inviteAlreadySent'))
        return
      }

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('inviteError'))
        return
      }

      toast.success(t('inviteSent'))
      setExistingInvite({ email: email.trim(), used: false })
      setEmail('')
      onClose()
    } catch {
      toast.error(t('inviteError'))
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('inviteParent')}</DialogTitle>
          <DialogDescription>
            {t('inviteParentDescription', { studentName })}
          </DialogDescription>
        </DialogHeader>

        {loadingStatus ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : existingInvite?.accepted_at ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-700 dark:text-green-300">{t('inviteAccepted')}</p>
              <p className="text-green-600 dark:text-green-400">{existingInvite.email}</p>
            </div>
          </div>
        ) : existingInvite && !existingInvite.used ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-300">{t('invitePending')}</p>
              <p className="text-amber-600 dark:text-amber-400">{existingInvite.email}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-email">{t('emailLabel')}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>{tc('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={sending || !email.trim()}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {sending ? tc('processing') : t('sendInvite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
