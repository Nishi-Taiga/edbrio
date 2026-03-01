'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Sparkles, BookOpen, Calendar, CreditCard, ArrowRight, ChevronDown, Check, Menu, X, Send } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Legend } from 'recharts'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export default function HomePage() {
  const t = useTranslations('landing')
  const tCommon = useTranslations('common')
  const tMetadata = useTranslations('metadata')

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [contactError, setContactError] = useState('')

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactStatus('sending')
    setContactError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || tCommon('sendFailed'))
      }
      setContactStatus('sent')
      setContactForm({ name: '', email: '', message: '' })
    } catch (err: unknown) {
      setContactError(err instanceof Error ? err.message : tCommon('sendFailed'))
      setContactStatus('error')
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EdBrio',
    applicationCategory: 'EducationalApplication',
    description: tMetadata('jsonLdDescription'),
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
      description: tMetadata('jsonLdOfferDescription')
    }
  }

  return (
    <div className="light bg-white text-foreground font-sans antialiased overflow-x-hidden" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', colorScheme: 'light' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-brand-950/80 backdrop-blur-md border-b border-brand-100/50 dark:border-brand-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <EdBrioLogo size={32} className="shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-300">EdBrio</span>
            <span className="hidden sm:inline bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">ALPHA</span>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.features')}</a>
            <a href="#use-cases" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.useCases')}</a>
            <a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.pricing')}</a>
            <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.faq')}</a>
            <a href="#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.contact')}</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Link href="/login" className="hidden md:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition whitespace-nowrap">{t('nav.login')}</Link>
            <Link href="/login" className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg shadow-brand-600/20 whitespace-nowrap">
              {t('nav.getStartedFree')}
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 text-slate-500 hover:text-brand-600 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={tCommon('menu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-brand-950/95 backdrop-blur-md border-t border-brand-100/50 dark:border-brand-800/30 px-4 pb-4">
            <div className="flex flex-col gap-1 pt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <a href="#features" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.features')}</a>
              <a href="#use-cases" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.useCases')}</a>
              <a href="#pricing" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.pricing')}</a>
              <a href="#faq" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.faq')}</a>
              <a href="#contact" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.contact')}</a>
              <div className="flex items-center gap-3 pt-2 md:hidden">
                <LanguageSwitcher />
                <Link href="/login" className="text-brand-600 font-bold" onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Alpha Notice ── */}
      <div className="fixed top-16 sm:top-20 w-full z-40 bg-amber-50 border-b border-amber-200 text-center py-2 px-4">
        <p className="text-[11px] sm:text-xs font-bold text-amber-700">
          {t('alphaNotice')}
        </p>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-36 sm:pt-48 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-950 dark:via-background dark:to-background">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-brand-400/20 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-accent-400/15 dark:bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-40 bg-brand-300/10 dark:bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/50 border border-brand-100 dark:border-brand-700/50 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-brand-600 dark:text-brand-300 mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {t('hero.badge')}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] mb-6 sm:mb-8">
            <span className="text-slate-900 dark:text-white">{t('hero.title1')}</span><br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">{t('hero.title2')}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-20">
            <Link href="/login" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-3xl font-bold text-base sm:text-lg transition shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2">
              {t('hero.ctaStart')} <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white dark:bg-brand-900/50 border border-slate-200 dark:border-brand-700/50 hover:bg-slate-50 dark:hover:bg-brand-800/50 text-slate-700 dark:text-slate-200 px-8 sm:px-10 py-4 sm:py-5 rounded-3xl font-bold text-base sm:text-lg transition text-center">
              {t('hero.ctaFeatures')}
            </a>
          </div>

          {/* AI Report Flow Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-400/30 to-accent-400/20 dark:from-brand-600/20 dark:to-accent-600/10 rounded-[2rem] sm:rounded-[2.5rem] blur-2xl -z-10" />
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_32px_64px_-16px_rgba(124,58,237,0.15)] dark:shadow-[0_32px_64px_-16px_rgba(124,58,237,0.3)] border border-brand-100/50 dark:border-brand-700/30">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
                {/* Step 1 */}
                <div className="bg-slate-50 dark:bg-brand-950/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-brand-800/50 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">{t('flow.step1Title')}</div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <div className="bg-white dark:bg-brand-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-brand-800/30">{t('flow.step1Subject')}</div>
                    <div className="bg-white dark:bg-brand-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-brand-800/30">{t('flow.step1Comprehension')}</div>
                    <div className="bg-white dark:bg-brand-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-brand-800/30">{t('flow.step1Note')}</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex md:flex-col items-center gap-2 py-1 md:py-0">
                  <div className="hidden md:block w-0 h-0" />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-600 to-accent-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400">{t('flow.aiGenerate')}</span>
                </div>

                {/* Step 2 */}
                <div className="bg-brand-50 dark:bg-brand-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-brand-100 dark:border-brand-700/30 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2 sm:mb-3">{t('flow.step2Title')}</div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">{t('flow.step2ReportTitle')}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('flow.step2ReportContent')}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-brand-100 dark:bg-brand-800/50 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">{t('flow.step2ShareOk')}</span>
                      <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">{t('flow.step2HomeworkIncluded')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-32 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-24">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">
              {t('features.sectionTitle1')}<span className="text-brand-600 dark:text-brand-400">{t('features.sectionTitle2')}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg">{t('features.sectionDescription')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* AI Reports — featured */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-900/30 dark:to-brand-950/50 border border-brand-100 dark:border-brand-700/30 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(124,58,237,0.2)] hover:translate-y-[-8px] hover:shadow-[0_20px_40px_-10px_rgba(124,58,237,0.2)] transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-100 dark:bg-brand-800/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5 sm:mb-8">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">{t('features.aiReportTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('features.aiReportDescription')}
              </p>
            </div>
            {/* Student Karte */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-raised border border-slate-100 dark:border-brand-800/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-8px] hover:border-brand-200 dark:hover:border-brand-700/50 transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 sm:mb-8">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">{t('features.studentKarteTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('features.studentKarteDescription')}
              </p>
            </div>
            {/* Scheduling */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-raised border border-slate-100 dark:border-brand-800/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-8px] hover:border-brand-200 dark:hover:border-brand-700/50 transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-50 dark:bg-purple-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 sm:mb-8">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">{t('features.schedulingTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('features.schedulingDescription')}
              </p>
            </div>
            {/* Payments */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-raised border border-slate-100 dark:border-brand-800/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-8px] hover:border-brand-200 dark:hover:border-brand-700/50 transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 sm:mb-8">
                <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">{t('features.paymentsTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('features.paymentsDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="py-16 sm:py-32 px-4 sm:px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">
              {t('useCases.sectionTitle1')}<span className="text-brand-600 dark:text-brand-400">{t('useCases.sectionTitle2')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            <div className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">&#x1F3E0;</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">{t('useCases.tutorTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {t('useCases.tutorDescription')}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">&#x1F3EB;</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">{t('useCases.jukuTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {t('useCases.jukuDescription')}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">&#x1F4BB;</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">{t('useCases.onlineTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {t('useCases.onlineDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 sm:py-32 px-4 sm:px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">{t('pricing.sectionTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg">{t('pricing.sectionDescription')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white dark:bg-surface-raised rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border border-slate-200 dark:border-brand-800/30 flex flex-col">
              <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">{t('pricing.freePlan')}</h3>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6">{t('pricing.freePrice')}</div>
              <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-10 text-sm">{t('pricing.freeDescription')}</p>
              <div className="flex-1">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> {t('pricing.freeStudents')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> {t('pricing.freeReports')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> {t('pricing.freeCalendar')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> {t('pricing.freeKarte')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> {t('pricing.freeStripe')}
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 sm:py-5 rounded-2xl bg-slate-100 dark:bg-brand-900/50 text-slate-900 dark:text-slate-200 font-bold text-center hover:bg-slate-200 dark:hover:bg-brand-800/50 transition block text-sm sm:text-base">
                {t('pricing.freeCta')}
              </Link>
            </div>

            {/* Standard Plan */}
            <div className="bg-white dark:bg-surface-raised rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border-2 border-brand-600 dark:border-brand-500 shadow-2xl shadow-brand-600/10 dark:shadow-brand-600/20 flex flex-col relative">
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-brand-600 dark:bg-brand-500 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold">
                {t('pricing.standardTrialBadge')}
              </div>
              <h3 className="text-lg font-bold text-brand-600 dark:text-brand-400 mb-2">{t('pricing.standardPlan')}</h3>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6">{t('pricing.standardPrice')}<span className="text-base sm:text-lg font-medium text-slate-400 dark:text-slate-500">{t('pricing.standardPriceUnit')}</span></div>
              <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-10 text-xs sm:text-sm">{t('pricing.standardDescription')}</p>
              <div className="flex-1">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {t('pricing.standardStudents')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {t('pricing.standardReports')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {t('pricing.standardCalendar')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {t('pricing.standardKarte')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {t('pricing.standardStripe')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> {t('pricing.standardSupport')}
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 sm:py-5 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white font-bold text-center transition shadow-lg shadow-brand-600/20 block text-sm sm:text-base">
                {t('pricing.standardCta')}
              </Link>
            </div>
          </div>

          {/* Fee Structure Explanation */}
          <div className="mt-12 sm:mt-16 bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-brand-800/30 p-6 sm:p-10">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6">{t('feeExplanation.title')}</h3>

            <div className="space-y-6">
              {/* Fee breakdown */}
              <div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4">
                  {t('feeExplanation.description')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-brand-950/30 rounded-xl p-4 sm:p-5">
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('feeExplanation.freePlanLabel')}</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{t('feeExplanation.freePlanTotal')}<span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">{t('feeExplanation.total')}</span></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('feeExplanation.freePlanBreakdown')}</div>
                  </div>
                  <div className="bg-brand-50 dark:bg-brand-950/50 rounded-xl p-4 sm:p-5 border border-brand-200 dark:border-brand-800/40">
                    <div className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-1">{t('feeExplanation.standardPlanLabel')}</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{t('feeExplanation.standardPlanTotal')}<span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">{t('feeExplanation.total')}</span></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('feeExplanation.standardPlanBreakdown')}</div>
                  </div>
                </div>
              </div>

              {/* Breakeven chart + table */}
              <div className="border-t border-slate-100 dark:border-brand-800/20 pt-6">
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">{t('feeExplanation.breakevenTitle')}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  {t('feeExplanation.breakevenDescription')}
                </p>

                {/* Area Chart */}
                {(() => {
                  const FREE_RATE = 0.106
                  const STD_RATE = 0.05
                  const STD_MONTHLY = 1480
                  const BREAKEVEN = Math.round(STD_MONTHLY / (FREE_RATE - STD_RATE))
                  const revenues = [0, 10000, 20000, BREAKEVEN, 40000, 60000, 80000, 100000]
                  const chartData = revenues.map(r => ({
                    revenue: r,
                    free: Math.round(r * FREE_RATE),
                    standard: Math.round(r * STD_RATE + STD_MONTHLY),
                  }))
                  const breakevenData = chartData.find(d => d.revenue === BREAKEVEN)!
                  const formatYen = (v: number) => `¥${v.toLocaleString()}`

                  return (
                    <div className="mb-6">
                      <div className="h-[280px] sm:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradFree" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="gradStandard" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                            <XAxis
                              dataKey="revenue"
                              tickFormatter={(v) => v === 0 ? '¥0' : `¥${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}万`}
                              tick={{ fontSize: 11, fill: 'currentColor' }}
                              className="text-slate-500 dark:text-slate-400"
                              axisLine={{ stroke: 'currentColor' }}
                              tickLine={{ stroke: 'currentColor' }}
                            />
                            <YAxis
                              tickFormatter={formatYen}
                              tick={{ fontSize: 11, fill: 'currentColor' }}
                              className="text-slate-500 dark:text-slate-400"
                              axisLine={{ stroke: 'currentColor' }}
                              tickLine={{ stroke: 'currentColor' }}
                              width={65}
                            />
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                formatYen(value),
                                name === 'free' ? t('feeExplanation.chartFreeLabel') : t('feeExplanation.chartStandardLabel'),
                              ]}
                              labelFormatter={(v: number) => `${t('feeExplanation.chartRevenue')}: ${formatYen(v)}`}
                              contentStyle={{
                                backgroundColor: 'var(--color-surface, #fff)',
                                border: '1px solid var(--color-border, #e2e8f0)',
                                borderRadius: '0.75rem',
                                fontSize: '0.8rem',
                              }}
                            />
                            <Legend
                              formatter={(value: string) =>
                                value === 'free' ? t('feeExplanation.chartFreeLabel') : t('feeExplanation.chartStandardLabel')
                              }
                              wrapperStyle={{ fontSize: '0.8rem' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="free"
                              stroke="#94a3b8"
                              strokeWidth={2.5}
                              fill="url(#gradFree)"
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="standard"
                              stroke="#7c3aed"
                              strokeWidth={2.5}
                              fill="url(#gradStandard)"
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                            <ReferenceDot
                              x={BREAKEVEN}
                              y={breakevenData.free}
                              r={6}
                              fill="#7c3aed"
                              stroke="#fff"
                              strokeWidth={2}
                              label={{
                                value: t('feeExplanation.chartBreakeven'),
                                position: 'top',
                                fontSize: 11,
                                fontWeight: 700,
                                fill: '#7c3aed',
                                offset: 10,
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-brand-800/30">
                        <th className="text-left py-2.5 pr-4 font-semibold text-slate-500 dark:text-slate-400">{t('feeExplanation.tableHeaderRevenue')}</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400">{t('feeExplanation.tableHeaderFreeFee')}</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400">{t('feeExplanation.tableHeaderStandardCost')}</th>
                        <th className="text-center py-2.5 pl-3 font-semibold text-slate-500 dark:text-slate-400">{t('feeExplanation.tableHeaderDifference')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 dark:text-slate-300">
                      <tr className="border-b border-dashed border-slate-100 dark:border-brand-800/20">
                        <td className="py-2.5 pr-4">&yen;20,000</td>
                        <td className="text-center py-2.5 px-3">&yen;2,120</td>
                        <td className="text-center py-2.5 px-3">&yen;2,480</td>
                        <td className="text-center py-2.5 pl-3 text-slate-400">{t('feeExplanation.freeIsBetter')}</td>
                      </tr>
                      <tr className="border-b border-dashed border-slate-100 dark:border-brand-800/20 bg-brand-50/50 dark:bg-brand-950/20">
                        <td className="py-2.5 pr-4 font-semibold">&yen;26,500</td>
                        <td className="text-center py-2.5 px-3">&yen;2,809</td>
                        <td className="text-center py-2.5 px-3">&yen;2,805</td>
                        <td className="text-center py-2.5 pl-3 font-semibold text-brand-600 dark:text-brand-400">{t('feeExplanation.sameAmount')}</td>
                      </tr>
                      <tr className="border-b border-dashed border-slate-100 dark:border-brand-800/20">
                        <td className="py-2.5 pr-4">&yen;50,000</td>
                        <td className="text-center py-2.5 px-3">&yen;5,300</td>
                        <td className="text-center py-2.5 px-3">&yen;3,980</td>
                        <td className="text-center py-2.5 pl-3 font-semibold text-emerald-600 dark:text-emerald-400">&yen;1,320 {t('feeExplanation.savings')}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4">&yen;100,000</td>
                        <td className="text-center py-2.5 px-3">&yen;10,600</td>
                        <td className="text-center py-2.5 px-3">&yen;6,480</td>
                        <td className="text-center py-2.5 pl-3 font-semibold text-emerald-600 dark:text-emerald-400">&yen;4,120 {t('feeExplanation.savings')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                  {t('feeExplanation.feeNote')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t('feeExplanation.freePlanLimitation')}
                </p>
              </div>

              {/* Industry Comparison */}
              <div className="border-t border-slate-100 dark:border-brand-800/20 pt-6">
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">{t('feeExplanation.industryComparisonTitle')}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
                  {t('feeExplanation.industryComparisonDescription')}
                </p>

                {/* Comparison bars */}
                <div className="space-y-4 mb-6">
                  {/* Agency */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('feeExplanation.industryAgencyLabel')}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{t('feeExplanation.industryAgencyRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-brand-950/30 rounded-full h-3">
                      <div className="bg-red-400 dark:bg-red-500 h-3 rounded-full" style={{ width: '55%' }} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('feeExplanation.industryAgencyNote')}</p>
                  </div>
                  {/* Matching */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('feeExplanation.industryMatchingLabel')}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{t('feeExplanation.industryMatchingRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-brand-950/30 rounded-full h-3">
                      <div className="bg-amber-400 dark:bg-amber-500 h-3 rounded-full" style={{ width: '35%' }} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('feeExplanation.industryMatchingNote')}</p>
                  </div>
                  {/* EdBrio */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{t('feeExplanation.industryEdbrioLabel')}</span>
                      <span className="text-sm font-black text-brand-600 dark:text-brand-400">{t('feeExplanation.industryEdbrioRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-brand-950/30 rounded-full h-3">
                      <div className="bg-brand-500 dark:bg-brand-400 h-3 rounded-full" style={{ width: '5%' }} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('feeExplanation.industryEdbrioNote')}</p>
                  </div>
                </div>

                {/* Concrete example */}
                <div className="bg-slate-50 dark:bg-brand-950/30 rounded-xl p-4 sm:p-5">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{t('feeExplanation.industryExampleTitle')}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500 mt-1.5 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">{t('feeExplanation.industryExampleAgency')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 mt-1.5 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">{t('feeExplanation.industryExampleMatching')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400 mt-1.5 shrink-0" />
                      <span className="font-bold text-brand-600 dark:text-brand-400">{t('feeExplanation.industryExampleEdbrio')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-32 px-4 sm:px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-center mb-10 sm:mb-16 tracking-tight text-slate-900 dark:text-white">{t('faq.title')}</h2>
          <div className="space-y-3 sm:space-y-4">
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q1')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a1')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q2')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a2')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q3')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a3')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q4')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a4')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q5')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a5')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q6')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a6')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q7')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a7')}
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>{t('faq.q8')}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {t('faq.a8')}
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section id="contact" className="py-16 sm:py-32 px-4 sm:px-6 bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">{t('contact.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg">{t('contact.description')}</p>
          </div>

          {contactStatus === 'sent' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">{tCommon('sendComplete')}</h3>
              <p className="text-emerald-600 text-sm">{tCommon('sendCompleteMessage')}</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-brand-800/30 shadow-sm space-y-5">
              {contactError && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {contactError}
                </div>
              )}
              <div>
                <label htmlFor="contact-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('contact.nameLabel')}</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-brand-800/30 bg-white dark:bg-brand-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t('contact.namePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('contact.emailLabel')}</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={254}
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-brand-800/30 bg-white dark:bg-brand-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t('contact.emailPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t('contact.messageLabel')}</label>
                <textarea
                  id="contact-message"
                  required
                  maxLength={5000}
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-brand-800/30 bg-white dark:bg-brand-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={contactStatus === 'sending'}
                className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-60 text-sm sm:text-base"
              >
                {contactStatus === 'sending' ? tCommon('sending') : <><Send className="w-4 h-4" /> {tCommon('send')}</>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-surface pt-12 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 border-t border-slate-200 dark:border-brand-800/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 mb-12 sm:mb-20">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
              <EdBrioLogo size={32} className="shrink-0" />
              <span className="text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-400">EdBrio</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
              {t('footer.description')}
            </p>
            <a href="https://x.com/EdBrio_info" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              @EdBrio_info
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 sm:gap-16 w-full md:w-auto">
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.productHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.features')}</a></li>
                <li><a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.pricing')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.legalHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                <li><Link href="/legal?tab=sctl" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.sctl')}</Link></li>
                <li><Link href="/legal?tab=privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.privacy')}</Link></li>
                <li><a href="#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.snsHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                <li><a href="https://x.com/EdBrio_info" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest">
          <span>{t('footer.copyright')}</span>
        </div>
      </footer>
    </div>
  )
}
