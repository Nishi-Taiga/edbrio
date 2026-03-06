"use client"

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Bell, Sun, Moon, Monitor, FileText, Globe, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import type { NotificationPreferences } from '@/lib/types/database'

const localeLabels: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  sv: 'Svenska',
  ru: 'Русский',
  zh: '中文',
  ko: '한국어',
  ar: 'العربية',
  pt: 'Português',
  de: 'Deutsch',
  hi: 'हिन्दी',
  'zh-TW': '繁體中文',
}

export default function GuardianSettingsPage() {
  const t = useTranslations('guardianSettings')
  const tNotif = useTranslations('notificationSettings')
  const tTheme = useTranslations('teacherProfile')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const { theme, setTheme } = useTheme()

  const tc = useTranslations('common')
  const { signOut } = useAuth()

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({})
  const [notifSaving, setNotifSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadPrefs() {
      try {
        const res = await fetch('/api/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setNotifPrefs(data.preferences || {})
        }
      } catch {
        // Ignore - non-critical
      }
    }
    loadPrefs()
    return () => { mounted = false }
  }, [])

  const handleNotifToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const prev = { ...notifPrefs }
    const updated = { ...notifPrefs, [key]: value }
    setNotifPrefs(updated)
    setNotifSaving(true)
    try {
      const res = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        toast.success(tNotif('saveSuccess'))
      }
    } catch {
      setNotifPrefs(prev)
    } finally {
      setNotifSaving(false)
    }
  }

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
    <ProtectedRoute allowedRoles={['guardian']}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('description')}</p>
        </div>

        {/* Email Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {tNotif('title')}
            </CardTitle>
            <CardDescription>{tNotif('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {([
                'booking_confirmation',
                'booking_cancellation',
                'report_published',
                'new_chat_message',
                'booking_reminder',
                'ticket_purchase',
              ] as const).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tNotif(key)}</p>
                    <p className="text-xs text-muted-foreground">{tNotif(`${key}Desc`)}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[key] !== false}
                    onCheckedChange={(checked) => handleNotifToggle(key, checked)}
                    disabled={notifSaving}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{tTheme('themeTitle')}</CardTitle>
            <CardDescription>{tTheme('themeDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="text-sm font-semibold">{tTheme('themeLight')}</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
              >
                <Moon className="w-6 h-6 text-brand-500" />
                <span className="text-sm font-semibold">{tTheme('themeDark')}</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${theme === 'system' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
              >
                <Monitor className="w-6 h-6 text-slate-500" />
                <span className="text-sm font-semibold">{tTheme('themeSystem')}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('languageTitle')}
            </CardTitle>
            <CardDescription>{t('languageDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative inline-flex items-center">
              <Globe className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={locale}
                onChange={(e) => router.replace(pathname, { locale: e.target.value })}
                className="appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-lg pl-9 pr-8 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Language"
              >
                {routing.locales.map((loc) => (
                  <option key={loc} value={loc}>
                    {localeLabels[loc]}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('cancellationPolicyTitle')}
            </CardTitle>
            <CardDescription>{t('cancellationPolicyDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {t('cancellationPolicyContent')}
            </div>
          </CardContent>
        </Card>

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
      </div>
    </ProtectedRoute>
  )
}
