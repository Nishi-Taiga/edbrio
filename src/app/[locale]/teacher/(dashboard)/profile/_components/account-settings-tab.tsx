'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sun, Moon, Monitor, Mail, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import type { SupabaseClient } from '@supabase/supabase-js'

interface AccountSettingsTabProps {
  supabase: SupabaseClient
}

export function AccountSettingsTab({ supabase }: AccountSettingsTabProps) {
  const t = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const { theme, setTheme } = useTheme()
  const { dbUser } = useAuth()

  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    setEmailSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) throw error
      toast.success(t('emailChangeSuccess'))
      setNewEmail('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('emailChangeError'))
    } finally {
      setEmailSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }
    if (newPassword.length < 6) {
      toast.error(t('passwordTooShort'))
      return
    }
    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success(t('passwordChangeSuccess'))
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('passwordChangeError'))
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <>
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('themeTitle')}</CardTitle>
          <CardDescription>{t('themeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span className="text-sm font-semibold">{t('themeLight')}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
            >
              <Moon className="w-6 h-6 text-brand-500" />
              <span className="text-sm font-semibold">{t('themeDark')}</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'system' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
            >
              <Monitor className="w-6 h-6 text-slate-500" />
              <span className="text-sm font-semibold">{t('themeSystem')}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings: Email & Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t('accountSettingsTitle')}
          </CardTitle>
          <CardDescription>{t('accountSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email change */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('emailChangeLabel')}</h4>
            <p className="text-xs text-muted-foreground mb-2">
              {t('currentEmail')}: <span className="font-medium text-foreground">{dbUser?.email || '-'}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder={t('newEmailPlaceholder')}
                className="flex-1"
              />
              <Button
                onClick={handleEmailChange}
                disabled={emailSaving || !newEmail.trim()}
                size="sm"
              >
                {emailSaving ? tc('saving') : t('changeEmail')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('emailChangeNote')}</p>
          </div>

          <div className="border-t" />

          {/* Password change */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('passwordChangeLabel')}</h4>
            <div className="space-y-2 max-w-sm">
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
              />
              <Button
                onClick={handlePasswordChange}
                disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                size="sm"
              >
                {passwordSaving ? tc('saving') : t('changePassword')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function DeleteAccountSection() {
  const t = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const { signOut } = useAuth()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('deleteAccountError'))
        return
      }
      await signOut()
      window.location.href = '/'
    } catch {
      toast.error(t('deleteAccountError'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Delete Account */}
      <Card className="border-red-200 dark:border-red-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            {t('deleteAccountTitle')}
          </CardTitle>
          <CardDescription>{t('deleteAccountDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            {t('deleteAccountButton')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAccountConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('deleteAccountConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {tc('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? tc('deleting') : tc('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
