"use client"

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Bell, Sun, Moon, Monitor, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import type { NotificationPreferences } from '@/lib/types/database'

export default function GuardianSettingsPage() {
  const t = useTranslations('guardianSettings')
  const tNotif = useTranslations('notificationSettings')
  const tTheme = useTranslations('teacherProfile')

  const { theme, setTheme } = useTheme()

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({})
  const [notifSaving, setNotifSaving] = useState(false)

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
      </div>
    </ProtectedRoute>
  )
}
