"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SetupBannerProps {
  missingItems: string[]
  totalItems: number
}

export function SetupBanner({ missingItems, totalItems }: SetupBannerProps) {
  const t = useTranslations('teacherDashboard')
  const tp = useTranslations('teacherProfile')

  const completedCount = totalItems - missingItems.length
  const progressPercent = (completedCount / totalItems) * 100

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-300">{t('initialSetupIncomplete')}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              {missingItems.length > 0
                ? t('initialSetupDescriptionDynamic', { items: missingItems.map(k => tp(k)).join('・') })
                : t('initialSetupDescription')}
            </p>

            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-amber-200 dark:bg-amber-800/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                {t('setupProgress', { completed: completedCount, total: totalItems })}
              </span>
            </div>

            <Link href="/teacher/setup">
              <Button size="sm" variant="outline" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30">
                {t('goToSetup')}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
