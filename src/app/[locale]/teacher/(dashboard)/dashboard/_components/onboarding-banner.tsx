"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface OnboardingBannerProps {
  hasShift: boolean
  hasInvite: boolean
}

export function OnboardingBanner({ hasShift, hasInvite }: OnboardingBannerProps) {
  const t = useTranslations('teacherDashboard')

  const steps = [
    { label: t('onboardingStep1'), done: true },
    { label: t('onboardingStep2'), done: hasShift },
    { label: t('onboardingStep3'), done: hasInvite },
  ]

  const completedCount = steps.filter((s) => s.done).length

  return (
    <Card className="border-brand-200 bg-brand-50 dark:border-brand-800/30 dark:bg-brand-900/10">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <p className="font-medium text-brand-800 dark:text-brand-300">{t('onboardingTitle')}</p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-0.5">{t('onboardingSubtitle')}</p>

            <div className="mt-3 space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-brand-300 dark:text-brand-600 shrink-0" />
                  )}
                  <span className={step.done ? 'line-through text-brand-400 dark:text-brand-600' : 'text-brand-800 dark:text-brand-300'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {!hasShift && (
                <Link href="/teacher/calendar">
                  <Button size="sm" variant="outline" className="border-brand-300 text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/30">
                    {t('onboardingGoToCalendar')}
                  </Button>
                </Link>
              )}
              {!hasInvite && (
                <Link href="/teacher/profile">
                  <Button size="sm" variant="outline" className="border-brand-300 text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/30">
                    {t('onboardingGoToInvite')}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-brand-700 dark:text-brand-300">{completedCount}</span>
            <span className="text-sm text-brand-500 dark:text-brand-500"> / 3</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
