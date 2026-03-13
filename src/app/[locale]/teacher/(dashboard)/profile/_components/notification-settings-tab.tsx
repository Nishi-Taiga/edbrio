'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, CalendarDays } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useTranslations } from 'next-intl'
import type { NotificationPreferences } from '@/lib/types/database'

interface NotificationSettingsTabProps {
  notifPrefs: NotificationPreferences
  notifSaving: boolean
  handleNotifToggle: (key: keyof NotificationPreferences, value: boolean | number) => Promise<void>
}

export function NotificationSettingsTab({
  notifPrefs,
  notifSaving,
  handleNotifToggle,
}: NotificationSettingsTabProps) {
  const t = useTranslations('teacherProfile')
  const tNotif = useTranslations('notificationSettings')

  return (
    <>
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
              'new_chat_message',
              'booking_reminder',
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

      {/* Calendar Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('calendarSettingsTitle') || 'カレンダー設定'}</CardTitle>
          <CardDescription>{t('calendarSettingsDescription') || '週の開始曜日を設定します'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <button
              onClick={() => handleNotifToggle('calendar_week_start', 0)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${(notifPrefs.calendar_week_start ?? 0) === 0 ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
            >
              <CalendarDays className="w-6 h-6 text-brand-500" />
              <span className="text-sm font-semibold">{t('calendarSunday') || '日曜始まり'}</span>
            </button>
            <button
              onClick={() => handleNotifToggle('calendar_week_start', 1)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition cursor-pointer ${notifPrefs.calendar_week_start === 1 ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-border-semantic hover:border-brand-300'}`}
            >
              <CalendarDays className="w-6 h-6 text-slate-500" />
              <span className="text-sm font-semibold">{t('calendarMonday') || '月曜始まり'}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
