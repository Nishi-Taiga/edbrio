'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Loader2, Clock, CheckCircle2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import type { Invite } from '@/lib/types/database'

type InviteListItem = Pick<Invite, 'id' | 'email' | 'method' | 'used' | 'accepted_at' | 'created_at'>

interface InviteTabProps {
  inviteList: InviteListItem[]
  setInviteList: React.Dispatch<React.SetStateAction<InviteListItem[]>>
  inviteListLoading: boolean
}

export function InviteTab({
  inviteList,
  setInviteList,
  inviteListLoading,
}: InviteTabProps) {
  const tc = useTranslations('common')
  const tInvite = useTranslations('invite')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<'email' | 'qr'>('email')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const handleInvite = async () => {
    if (inviteMethod === 'email' && !inviteEmail.trim()) return
    setInviteSending(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: inviteMethod,
          ...(inviteMethod === 'email' ? { email: inviteEmail.trim() } : {}),
        }),
      })
      if (res.status === 409) {
        toast.error(tInvite('inviteAlreadySent'))
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || tInvite('inviteError'))
        return
      }
      const data = await res.json()

      if (inviteMethod === 'email') {
        toast.success(tInvite('inviteSent'))
        setInviteList(prev => [{ id: data.token, email: inviteEmail.trim(), method: 'email', used: false, created_at: new Date().toISOString() }, ...prev])
        setInviteEmail('')
      } else {
        // QR method — generate QR code on client
        const QRCode = (await import('qrcode')).default
        const appUrl = window.location.origin
        const inviteUrl = `${appUrl}/invite/${data.token}`
        const dataUrl = await QRCode.toDataURL(inviteUrl, { width: 256, margin: 2 })
        setQrDataUrl(dataUrl)
        setInviteList(prev => [{ id: data.token, method: 'qr', used: false, created_at: new Date().toISOString() }, ...prev])
      }
    } catch {
      toast.error(tInvite('inviteError'))
    } finally {
      setInviteSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {tInvite('inviteParent')}
        </CardTitle>
        <CardDescription>{tInvite('inviteParentSettingsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inviteMethod} onValueChange={(v) => {
          setInviteMethod(v as 'email' | 'qr')
          setQrDataUrl(null)
        }}>
          <TabsList className="mb-4">
            <TabsTrigger value="email" className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              {tInvite('emailTab')}
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4" />
              {tInvite('qrTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">{tInvite('emailLabel')}</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={tInvite('emailPlaceholder')}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleInvite} disabled={inviteSending || !inviteEmail.trim()}>
                  {inviteSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
                  {inviteSending ? tc('processing') : tInvite('sendInvite')}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr">
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 rounded-lg border" />
                <p className="text-sm text-muted-foreground">{tInvite('qrScanInstruction')}</p>
                <p className="text-xs text-muted-foreground">{tInvite('qrExpires')}</p>
                <Button variant="outline" onClick={() => setQrDataUrl(null)}>
                  {tInvite('qrGenerateNew')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <QrCode className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">{tInvite('qrDescription')}</p>
                <Button onClick={handleInvite} disabled={inviteSending}>
                  {inviteSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                  {tInvite('qrGenerate')}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Invite history */}
        {inviteList.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium mb-3">{tInvite('inviteHistory')}</h4>
            <div className="space-y-2">
              {inviteList.map((inv) => (
                <div key={inv.id} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                  inv.accepted_at
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                }`}>
                  {inv.accepted_at ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span className={inv.accepted_at
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-amber-700 dark:text-amber-300'
                  }>
                    {inv.email || tInvite('qrInvite')}
                    {' - '}
                    {inv.accepted_at ? tInvite('inviteAccepted') : tInvite('invitePending')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
