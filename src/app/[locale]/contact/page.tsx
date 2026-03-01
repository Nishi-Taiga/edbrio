'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { Mail, Clock, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const t = useTranslations('contact')
  const tLanding = useTranslations('landing')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-950 text-foreground">
      {/* Navigation — same style as LP */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-brand-950/80 backdrop-blur-md border-b border-brand-100/50 dark:border-brand-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <EdBrioLogo size={32} className="shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-300">EdBrio</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition whitespace-nowrap">{tLanding('nav.login')}</Link>
            <Link href="/login" className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg shadow-brand-600/20 whitespace-nowrap">
              {tLanding('nav.getStartedFree')}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-28 sm:pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t('pageTitle')}</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">{t('pageDescription')}</p>
        </div>

        {/* Email card */}
        <div className="bg-white dark:bg-brand-900/30 rounded-2xl border border-slate-200 dark:border-brand-800/30 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-800/40 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('emailTitle')}</h2>
          </div>
          <a
            href="mailto:info@edbrio.com"
            className="inline-block text-brand-600 dark:text-brand-400 font-bold text-lg hover:underline"
          >
            info@edbrio.com
          </a>
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{t('responseTime')}</span>
          </div>
        </div>

        {/* What to include */}
        <div className="bg-white dark:bg-brand-900/30 rounded-2xl border border-slate-200 dark:border-brand-800/30 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('includeTitle')}</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              {t('includeEmail')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              {t('includePlan')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              {t('includeDetail')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              {t('includeBug')}
            </li>
          </ul>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-between text-sm text-slate-400 dark:text-slate-500">
          <Link href="/legal" className="hover:text-brand-600 dark:hover:text-brand-400 transition font-medium">
            {t('legalLink')}
          </Link>
          <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            &larr; {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
