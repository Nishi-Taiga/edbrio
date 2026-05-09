'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { Sparkles, Calendar, MessageCircle, TrendingDown } from 'lucide-react'
import { PreRegisterForm } from '@/app/[locale]/_components/landing/pre-register-form'

export default function PreRegisterPage() {
  const t = useTranslations('landing.preRegister')

  const features = [
    { icon: Sparkles, text: t('featureAi') },
    { icon: Calendar, text: t('featureSchedule') },
    { icon: MessageCircle, text: t('featureChat') },
    { icon: TrendingDown, text: t('featureFee') },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <EdBrioLogo size={40} />
            <span className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
              EdBrio
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-950/10 bg-card p-8 shadow-sm dark:border-white/10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('pageTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('pageDescription')}
          </p>

          {/* Feature list */}
          <ul className="mt-6 space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-6 h-px bg-gray-950/10 dark:bg-white/10" />

          {/* Form */}
          <PreRegisterForm location="pre_register_page" />

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('alreadyRegistered')}{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
