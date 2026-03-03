'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Sparkles, BookOpen, Calendar, CreditCard, MessageSquare, ArrowRight, ChevronDown, Check, Menu, X, Send } from 'lucide-react'
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
    <div className="light bg-white text-slate-900 font-sans antialiased overflow-x-hidden" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', lineBreak: 'strict', colorScheme: 'light' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto" priority />
            <span className="hidden sm:inline bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">ALPHA</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-brand-600 transition">{t('nav.features')}</a>
            <a href="#use-cases" className="hover:text-brand-600 transition">{t('nav.useCases')}</a>
            <a href="#pricing" className="hover:text-brand-600 transition">{t('nav.pricing')}</a>
            <a href="#faq" className="hover:text-brand-600 transition">{t('nav.faq')}</a>
            <a href="#contact" className="hover:text-brand-600 transition">{t('nav.contact')}</a>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Link href="/login" className="hidden md:block text-sm font-medium text-slate-500 hover:text-brand-600 transition whitespace-nowrap">{t('nav.login')}</Link>
            <Link href="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap">
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
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 pb-4">
            <div className="flex flex-col gap-1 pt-2 text-sm font-medium text-slate-600">
              <a href="#features" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.features')}</a>
              <a href="#use-cases" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.useCases')}</a>
              <a href="#pricing" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.pricing')}</a>
              <a href="#faq" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.faq')}</a>
              <a href="#contact" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.contact')}</a>
              <div className="flex items-center gap-3 pt-2 md:hidden">
                <LanguageSwitcher />
                <Link href="/login" className="text-brand-600 font-semibold" onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero (Split Layout) ── */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 bg-gradient-to-b from-brand-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-semibold text-amber-700 mb-6 sm:mb-8">
                <span className="font-bold">ALPHA</span>
                <span className="w-1 h-1 bg-amber-400 rounded-full" />
                <span>{t('alphaNotice')}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                <span className="text-slate-900">{t('hero.title1')}</span><br />
                <span className="text-brand-600">{t('hero.title2')}</span>
              </h1>
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2">
                  {t('hero.ctaStart')} <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold text-base transition text-center">
                  {t('hero.ctaFeatures')}
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-brand-600/10">
                <picture>
                  <source srcSet="/screenshots/10_teacher_dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/10_teacher_dashboard.png" alt={t('screenshots.teacherAlt')} width={1400} height={900} className="w-full h-auto" loading="eager" />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights (3 cards) ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.features')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
              {t('features.sectionTitle1')}<span className="text-brand-600">{t('features.sectionTitle2')}</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-lg max-w-2xl mx-auto">{t('features.sectionDescription')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('features.aiReportTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('features.aiReportDescription')}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('features.schedulingTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('features.schedulingDescription')}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('features.paymentsTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('features.paymentsDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid (Why EdBrio + Screenshots) ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.whyEdBrio')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              {t('screenshots.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-100 flex flex-col justify-center">
              <div className="text-5xl sm:text-6xl font-black text-brand-600 mb-2">{t('stats.stat1Value')}</div>
              <div className="text-lg font-bold text-slate-900 mb-1">{t('stats.stat1Label')}</div>
              <p className="text-slate-500 text-sm leading-relaxed">{t('stats.stat1Description')}</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <picture>
                <source srcSet="/screenshots/10_teacher_dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                <img src="/screenshots/10_teacher_dashboard.png" alt={t('screenshots.teacherAlt')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
              </picture>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <picture>
                <source srcSet="/screenshots/20_guardian_dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                <img src="/screenshots/20_guardian_dashboard.png" alt={t('screenshots.guardianAlt')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
              </picture>
            </div>
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-100 flex flex-col justify-center">
              <div className="text-5xl sm:text-6xl font-black text-brand-600 mb-2">{t('stats.stat2Value')}</div>
              <div className="text-lg font-bold text-slate-900 mb-1">{t('stats.stat2Label')}</div>
              <p className="text-slate-500 text-sm leading-relaxed">{t('stats.stat2Description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works (3 Steps) ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.howItWorks')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-slate-500 text-sm sm:text-lg max-w-2xl mx-auto">{t('howItWorks.description')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: t('howItWorks.step1Number'), title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Description') },
              { num: t('howItWorks.step2Number'), title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Description') },
              { num: t('howItWorks.step3Number'), title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Description') },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-black text-brand-600">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Features Grid (5 cards with screenshots) ── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.allFeatures')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              {t('features.sectionTitle1')}<span className="text-brand-600">{t('features.sectionTitle2')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Reports */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 relative">
              <span className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold">{t('features.aiReportBadge')}</span>
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('features.aiReportTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t('features.aiReportDescription')}</p>
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <picture>
                  <source srcSet="/screenshots/14_teacher_reports-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/14_teacher_reports.png" alt={t('features.aiReportTitle')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
                </picture>
              </div>
            </div>
            {/* Student Karte */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('features.studentKarteTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t('features.studentKarteDescription')}</p>
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <picture>
                  <source srcSet="/screenshots/12_teacher_curriculum_list-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/12_teacher_curriculum_list.png" alt={t('features.studentKarteTitle')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
                </picture>
              </div>
            </div>
            {/* Scheduling */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('features.schedulingTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t('features.schedulingDescription')}</p>
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <picture>
                  <source srcSet="/screenshots/11_teacher_calendar-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/11_teacher_calendar.png" alt={t('features.schedulingTitle')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
                </picture>
              </div>
            </div>
            {/* Payments */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('features.paymentsTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t('features.paymentsDescription')}</p>
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <picture>
                  <source srcSet="/screenshots/21_guardian_booking-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/21_guardian_booking.png" alt={t('features.paymentsTitle')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
                </picture>
              </div>
            </div>
            {/* Chat */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 md:col-span-2 relative">
              <span className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold">{t('features.chatBadge')}</span>
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('features.chatTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('features.chatDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.useCases')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              {t('useCases.sectionTitle1')}<span className="text-brand-600">{t('useCases.sectionTitle2')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-10 border border-slate-100">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">&#x1F3E0;</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{t('useCases.tutorTitle')}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{t('useCases.tutorDescription')}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-10 border border-slate-100">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">&#x1F3EB;</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{t('useCases.jukuTitle')}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{t('useCases.jukuDescription')}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-10 border border-slate-100">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">&#x1F4BB;</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{t('useCases.onlineTitle')}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{t('useCases.onlineDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.pricing')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">{t('pricing.sectionTitle')}</h2>
            <p className="text-slate-500 text-sm sm:text-lg">{t('pricing.sectionDescription')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-400 mb-2">{t('pricing.freePlan')}</h3>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">{t('pricing.freePrice')}</div>
              <p className="text-slate-500 mb-8 text-sm">{t('pricing.freeDescription')}</p>
              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pricing.freeStudents')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pricing.freeReports')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pricing.freeCalendar')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pricing.freeKarte')}
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pricing.freeStripe')}
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition block text-sm">
                {t('pricing.freeCta')}
              </Link>
            </div>

            {/* Standard Plan - brand gradient */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-8 sm:p-10 flex flex-col relative text-white">
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-white/20 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">
                {t('pricing.standardTrialBadge')}
              </div>
              <h3 className="text-lg font-bold text-brand-200 mb-2">{t('pricing.standardPlan')}</h3>
              <div className="text-4xl sm:text-5xl font-black text-white mb-6">{t('pricing.standardPrice')}<span className="text-lg font-medium text-brand-200">{t('pricing.standardPriceUnit')}</span></div>
              <p className="text-brand-200 mb-8 text-xs sm:text-sm">{t('pricing.standardDescription')}</p>
              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardStudents')}
                  </li>
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardReports')}
                  </li>
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardCalendar')}
                  </li>
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardKarte')}
                  </li>
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardStripe')}
                  </li>
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardChat')}
                  </li>
                  <li className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                    <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t('pricing.standardSupport')}
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-white text-brand-600 font-bold text-center hover:bg-brand-50 transition block text-sm">
                {t('pricing.standardCta')}
              </Link>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="mt-12 sm:mt-16 bg-white rounded-2xl border border-slate-100 p-6 sm:p-10">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6">{t('feeExplanation.title')}</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 mb-4">{t('feeExplanation.description')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                    <div className="text-sm font-semibold text-slate-500 mb-1">{t('feeExplanation.freePlanLabel')}</div>
                    <div className="text-2xl font-black text-slate-900">{t('feeExplanation.freePlanTotal')}<span className="text-sm font-medium text-slate-400 ml-1">{t('feeExplanation.total')}</span></div>
                    <div className="text-xs text-slate-500 mt-1">{t('feeExplanation.freePlanBreakdown')}</div>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-4 sm:p-5 border border-brand-200">
                    <div className="text-sm font-semibold text-brand-600 mb-1">{t('feeExplanation.standardPlanLabel')}</div>
                    <div className="text-2xl font-black text-slate-900">{t('feeExplanation.standardPlanTotal')}<span className="text-sm font-medium text-slate-400 ml-1">{t('feeExplanation.total')}</span></div>
                    <div className="text-xs text-slate-500 mt-1">{t('feeExplanation.standardPlanBreakdown')}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-base font-bold text-slate-900 mb-3">{t('feeExplanation.industryComparisonTitle')}</h4>
                <p className="text-sm text-slate-600 mb-5">{t('feeExplanation.industryComparisonDescription')}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('feeExplanation.industryTakeHomeLabel')}</p>
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{t('feeExplanation.industryAgencyLabel')}</span>
                      <span className="text-sm font-black text-slate-900 whitespace-nowrap">{t('feeExplanation.industryAgencyRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className="bg-red-300 h-3 rounded-full" style={{ width: '45%' }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('feeExplanation.industryAgencyNote')}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{t('feeExplanation.industryMatchingLabel')}</span>
                      <span className="text-sm font-black text-slate-900 whitespace-nowrap">{t('feeExplanation.industryMatchingRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className="bg-amber-300 h-3 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('feeExplanation.industryMatchingNote')}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">{t('feeExplanation.industryEdbrioLabel')}</span>
                      <span className="text-sm font-black text-emerald-600 whitespace-nowrap">{t('feeExplanation.industryEdbrioRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '95%' }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('feeExplanation.industryEdbrioNote')}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 sm:p-5">
                  <h5 className="text-sm font-bold text-slate-900 mb-3">{t('feeExplanation.industryExampleTitle')}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-300 mt-1.5 shrink-0" />
                      <span className="text-slate-600">{t('feeExplanation.industryExampleAgency')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-300 mt-1.5 shrink-0" />
                      <span className="text-slate-600">{t('feeExplanation.industryExampleMatching')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="font-bold text-emerald-600">{t('feeExplanation.industryExampleEdbrio')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 block">{t('sections.faq')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">{t('faq.title')}</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl border border-slate-100">
                <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-sm sm:text-base list-none text-slate-900 gap-2">
                  <span>{t(`faq.q${i}`)}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 leading-relaxed text-sm">
                  {t(`faq.a${i}`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-8 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto bg-brand-950 rounded-3xl px-8 sm:px-16 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
            {t('ctaBanner.title')}
          </h2>
          <p className="text-brand-200 text-sm sm:text-lg mb-8 max-w-2xl mx-auto">
            {t('ctaBanner.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="bg-white text-brand-600 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base transition hover:bg-brand-50 flex items-center gap-2">
              {t('ctaBanner.ctaPrimary')} <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-sm sm:text-base transition hover:bg-white/10 text-center">
              {t('ctaBanner.ctaSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">{t('contact.title')}</h2>
            <p className="text-slate-500 text-sm sm:text-lg">{t('contact.description')}</p>
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
            <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 space-y-5">
              {contactError && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {contactError}
                </div>
              )}
              <div>
                <label htmlFor="contact-name" className="block text-sm font-bold text-slate-700 mb-1.5">{t('contact.nameLabel')}</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t('contact.namePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-bold text-slate-700 mb-1.5">{t('contact.emailLabel')}</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={254}
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={t('contact.emailPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-bold text-slate-700 mb-1.5">{t('contact.messageLabel')}</label>
                <textarea
                  id="contact-message"
                  required
                  maxLength={5000}
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={contactStatus === 'sending'}
                className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
              >
                {contactStatus === 'sending' ? tCommon('sending') : <><Send className="w-4 h-4" /> {tCommon('send')}</>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white pt-12 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 mb-12 sm:mb-20">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
              <Image src="/logo.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto" />
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              {t('footer.description')}
            </p>
            <a href="https://x.com/EdBrio_info" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-slate-500 hover:text-brand-600 transition">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              @EdBrio_info
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 sm:gap-16 w-full md:w-auto">
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.productHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600">
                <li><a href="#features" className="hover:text-brand-600 transition">{t('footer.features')}</a></li>
                <li><a href="#pricing" className="hover:text-brand-600 transition">{t('footer.pricing')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.legalHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600">
                <li><Link href="/legal?tab=sctl" className="hover:text-brand-600 transition">{t('footer.sctl')}</Link></li>
                <li><Link href="/legal?tab=privacy" className="hover:text-brand-600 transition">{t('footer.privacy')}</Link></li>
                <li><Link href="/contact" className="hover:text-brand-600 transition">{t('footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.snsHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600">
                <li><a href="https://x.com/EdBrio_info" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-widest">
          <span>{t('footer.copyright')}</span>
        </div>
      </footer>
    </div>
  )
}
