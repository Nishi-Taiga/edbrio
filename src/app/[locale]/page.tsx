'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Sparkles, BookOpen, Calendar, CreditCard, MessageSquare, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Check, Menu, X, Send } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export default function HomePage() {
  const t = useTranslations('landing')
  const tCommon = useTranslations('common')
  const tMetadata = useTranslations('metadata')

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [contactError, setContactError] = useState('')

  // Carousel
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoScrollPaused = useRef(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    if (!carouselRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }, [])

  const scrollCarousel = useCallback((direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    autoScrollPaused.current = true
    const card = carouselRef.current.children[0] as HTMLElement
    if (!card) return
    const scrollAmount = card.offsetWidth + 24
    carouselRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
    setTimeout(() => { autoScrollPaused.current = false }, 5000)
  }, [])

  // Scroll reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Carousel scroll tracking
  useEffect(() => {
    const container = carouselRef.current
    if (!container) return
    updateScrollState()
    container.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  // Auto-scroll carousel
  useEffect(() => {
    const container = carouselRef.current
    if (!container) return
    const interval = setInterval(() => {
      if (autoScrollPaused.current) return
      const { scrollLeft, scrollWidth, clientWidth } = container
      if (scrollLeft + clientWidth >= scrollWidth - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        const card = container.children[0] as HTMLElement
        if (card) container.scrollBy({ left: card.offsetWidth + 24, behavior: 'smooth' })
      }
    }, 4000)
    const pause = () => { autoScrollPaused.current = true }
    const resume = () => { setTimeout(() => { autoScrollPaused.current = false }, 3000) }
    container.addEventListener('pointerenter', pause)
    container.addEventListener('pointerleave', resume)
    container.addEventListener('touchstart', pause, { passive: true })
    container.addEventListener('touchend', resume)
    return () => {
      clearInterval(interval)
      container.removeEventListener('pointerenter', pause)
      container.removeEventListener('pointerleave', resume)
      container.removeEventListener('touchstart', pause)
      container.removeEventListener('touchend', resume)
    }
  }, [])

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
      description: tMetadata('jsonLdOfferDescription'),
    },
  }

  const featureCards = [
    {
      icon: Sparkles,
      iconContainerClass: 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400',
      badge: t('features.aiReportBadge'),
      title: t('features.aiReportTitle'),
      description: t('features.aiReportDescription'),
      screenshot: '/screenshots/14_teacher_reports.png',
      screenshotDark: '/screenshots/14_teacher_reports-dark.png',
    },
    {
      icon: BookOpen,
      iconContainerClass: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      title: t('features.studentKarteTitle'),
      description: t('features.studentKarteDescription'),
      screenshot: '/screenshots/12_teacher_curriculum_list.png',
      screenshotDark: '/screenshots/12_teacher_curriculum_list-dark.png',
    },
    {
      icon: Calendar,
      iconContainerClass: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      title: t('features.schedulingTitle'),
      description: t('features.schedulingDescription'),
      screenshot: '/screenshots/11_teacher_calendar.png',
      screenshotDark: '/screenshots/11_teacher_calendar-dark.png',
    },
    {
      icon: CreditCard,
      iconContainerClass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      title: t('features.paymentsTitle'),
      description: t('features.paymentsDescription'),
      screenshot: '/screenshots/21_guardian_booking.png',
      screenshotDark: '/screenshots/21_guardian_booking-dark.png',
    },
    {
      icon: MessageSquare,
      iconContainerClass: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
      badge: t('features.chatBadge'),
      title: t('features.chatTitle'),
      description: t('features.chatDescription'),
      screenshot: '/screenshots/18_teacher_chat.png',
      screenshotDark: '/screenshots/18_teacher_chat-dark.png',
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased overflow-x-hidden" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', lineBreak: 'strict' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        [data-reveal].revealed{opacity:1;transform:translateY(0)}
        [data-reveal][data-delay="1"]{transition-delay:.1s}
        [data-reveal][data-delay="2"]{transition-delay:.2s}
        [data-reveal][data-delay="3"]{transition-delay:.3s}
        [data-reveal][data-delay="4"]{transition-delay:.4s}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        @keyframes hero-rise{0%{opacity:0;transform:translateY(40px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
        .hero-screenshot{opacity:0}
        .revealed .hero-screenshot{animation:hero-rise .8s cubic-bezier(.22,1,.36,1) .3s forwards}
        .carousel-card{flex:0 0 calc(100vw - 4rem);min-width:0}
        @media(min-width:640px){.carousel-card{flex:0 0 calc(50% - 12px)}}
      `}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Fixed Header (Alpha Bar + Nav) ── */}
      <div className="fixed top-0 w-full z-50">
        <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 text-center py-2 px-4">
          <span className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300">
            <span className="font-black">ALPHA</span>
            <span className="mx-2 text-amber-300 dark:text-amber-600">|</span>
            {t('alphaNotice')}
          </span>
        </div>

        <nav className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto dark:hidden" priority />
              <Image src="/logo-dark.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto hidden dark:block" priority />
            </div>
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.features')}</a>
              <Link href="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.pricing')}</Link>
              <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.faq')}</a>
              <a href="#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('nav.contact')}</a>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <LanguageSwitcher className="hidden md:inline-flex" />
              <Link href="/login" className="hidden md:block text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap">{t('nav.login')}</Link>
              <Link href={{ pathname: '/login', query: { mode: 'signup' } }} className="bg-brand-600 hover:bg-brand-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap">
                {t('nav.getStartedFree')}
              </Link>
              <button
                type="button"
                className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 transition"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={tCommon('menu')}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 px-4 pb-4">
              <div className="flex flex-col gap-1 pt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <a href="#features" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.features')}</a>
                <Link href="/pricing" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>{t('nav.pricing')}</Link>
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
      </div>

      {/* ── Hero (Split Layout) ── */}
      <section className="pt-36 sm:pt-44 pb-16 sm:pb-24 px-5 sm:px-6 bg-gradient-to-b from-brand-50/50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div data-reveal>
              <h1 className="text-3xl sm:text-5xl lg:text-[3rem] font-black tracking-tight leading-[1.1] mb-6">
                <span className="text-slate-900 dark:text-white whitespace-nowrap">{t('hero.title1')}</span><br />
                <span className="text-brand-600 dark:text-brand-400">{t('hero.title2')}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={{ pathname: '/login', query: { mode: 'signup' } }} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2">
                  {t('hero.ctaStart')} <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-2xl font-bold text-base transition text-center">
                  {t('hero.ctaFeatures')}
                </a>
              </div>
            </div>
            <div data-reveal data-delay="2" className="relative">
              <div className="hero-screenshot rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl shadow-brand-600/10 dark:shadow-brand-400/5">
                <picture>
                  <source srcSet="/screenshots/10_teacher_dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/10_teacher_dashboard.png" alt={t('screenshots.teacherAlt')} width={1400} height={900} className="w-full h-auto" loading="eager" />
                </picture>
              </div>
              {/* Mobile phone overlay */}
              <div className="hero-screenshot absolute -bottom-6 right-3 sm:-bottom-8 sm:right-4 w-[90px] sm:w-[130px] rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-[3px] border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900">
                <picture>
                  <source srcSet="/screenshots/10_teacher_dashboard_mobile-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/10_teacher_dashboard_mobile.png" alt={t('screenshots.teacherAlt')} width={390} height={844} className="w-full h-auto" loading="eager" />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid (Why EdBrio + Screenshots) ── */}
      <section className="hidden md:block py-16 sm:py-24 px-5 sm:px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16" data-reveal>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 block">{t('sections.whyEdBrio')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('screenshots.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 sm:p-10 border border-slate-100 dark:border-slate-700 flex flex-col justify-center" data-reveal>
              <div className="text-5xl sm:text-6xl font-black text-brand-600 dark:text-brand-400 mb-2">{t('stats.stat1Value')}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('stats.stat1Label')}</div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{t('stats.stat1Description')}</p>
            </div>
            <div className="relative rounded-2xl overflow-visible" data-reveal data-delay="1">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <picture>
                  <source srcSet="/screenshots/10_teacher_dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/10_teacher_dashboard.png" alt={t('screenshots.teacherAlt')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
                </picture>
              </div>
              <div className="absolute -bottom-4 -right-3 sm:-bottom-6 sm:-right-4 w-[80px] sm:w-[110px] rounded-lg sm:rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-900">
                <picture>
                  <source srcSet="/screenshots/10_teacher_dashboard_mobile-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/screenshots/10_teacher_dashboard_mobile.png" alt={t('screenshots.teacherAlt')} width={390} height={844} className="w-full h-auto" loading="lazy" />
                </picture>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700" data-reveal data-delay="2">
              <picture>
                <source srcSet="/screenshots/20_guardian_dashboard-dark.png" media="(prefers-color-scheme: dark)" />
                <img src="/screenshots/20_guardian_dashboard.png" alt={t('screenshots.guardianAlt')} width={1400} height={900} className="w-full h-auto" loading="lazy" />
              </picture>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 sm:p-10 border border-slate-100 dark:border-slate-700 flex flex-col justify-center" data-reveal data-delay="3">
              <div className="text-5xl sm:text-6xl font-black text-brand-600 dark:text-brand-400 mb-2">{t('stats.stat2Value')}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('stats.stat2Label')}</div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{t('stats.stat2Description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Carousel (5 cards) ── */}
      <section id="features" className="hidden md:block py-16 sm:py-24 px-5 sm:px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16" data-reveal>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 block">{t('sections.features')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              {t('features.sectionTitle1')}<span className="text-brand-600 dark:text-brand-400">{t('features.sectionTitle2')}</span>
            </h2>
          </div>

          <div className="relative" data-reveal>
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg flex items-center justify-center transition ${canScrollLeft ? 'opacity-100 hover:bg-slate-50 dark:hover:bg-slate-700' : 'opacity-0 pointer-events-none'}`}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-1 py-1"
            >
              {featureCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="carousel-card snap-start bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 flex flex-col relative overflow-hidden"
                  >
                    {card.badge && (
                      <span className="absolute top-4 right-4 bg-brand-50 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold">
                        {card.badge}
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.iconContainerClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{card.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1">{card.description}</p>
                    <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[180px]">
                      <picture>
                        <source srcSet={card.screenshotDark} media="(prefers-color-scheme: dark)" />
                        <img src={card.screenshot} alt={card.title} width={700} height={450} className="w-full h-auto object-cover object-top" loading="lazy" />
                      </picture>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg flex items-center justify-center transition ${canScrollRight ? 'opacity-100 hover:bg-slate-50 dark:hover:bg-slate-700' : 'opacity-0 pointer-events-none'}`}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works (3 Steps) ── */}
      <section className="hidden md:block py-16 sm:py-24 px-5 sm:px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16" data-reveal>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 block">{t('sections.howItWorks')}</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              {t('howItWorks.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: t('howItWorks.step1Number'), title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Description'), screenshot: '/screenshots/13_teacher_report_new.png' },
              { num: t('howItWorks.step2Number'), title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Description'), screenshot: '/screenshots/14_teacher_reports.png' },
              { num: t('howItWorks.step3Number'), title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Description'), screenshot: '/screenshots/22_guardian_reports.png' },
            ].map((step, i) => (
              <div key={step.num} className="text-center" data-reveal data-delay={String(i + 1)}>
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={step.screenshot} alt={step.title} width={700} height={450} className="w-full h-auto" loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="hidden md:block py-16 sm:py-24 px-5 sm:px-6 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16" data-reveal>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">{t('faq.title')}</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <details key={i} className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700" data-reveal>
                <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-sm sm:text-base list-none text-slate-900 dark:text-white gap-2">
                  <span>{t(`faq.q${i}`)}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <div className="px-5 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                  {t(`faq.a${i}`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="hidden md:block py-8 sm:py-16 px-5 sm:px-6" data-reveal>
        <div className="max-w-6xl mx-auto bg-brand-950 rounded-3xl px-8 sm:px-16 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
            {t('ctaBanner.title')}
          </h2>
          <p className="text-brand-200 text-sm sm:text-lg mb-8 max-w-2xl mx-auto">
            {t('ctaBanner.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={{ pathname: '/login', query: { mode: 'signup' } }} className="bg-white text-brand-600 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base transition hover:bg-brand-50 flex items-center gap-2">
              {t('ctaBanner.ctaPrimary')} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-sm sm:text-base transition hover:bg-white/10 text-center">
              {t('nav.pricing')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section id="contact" className="hidden md:block py-16 sm:py-24 px-5 sm:px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-16" data-reveal>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-4">{t('contact.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg">{t('contact.description')}</p>
          </div>

          {contactStatus === 'sent' ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 sm:p-12 text-center" data-reveal>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-2">{tCommon('sendComplete')}</h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">{tCommon('sendCompleteMessage')}</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 sm:p-10 border border-slate-100 dark:border-slate-700 space-y-5" data-reveal>
              {contactError && (
                <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
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
      <footer className="hidden md:block bg-white dark:bg-slate-950 pt-12 sm:pt-24 pb-8 sm:pb-12 px-5 sm:px-6 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 mb-12 sm:mb-20">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
              <Image src="/logo.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto dark:hidden" />
              <Image src="/logo-dark.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto hidden dark:block" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
              {t('footer.description')}
            </p>
            <a href="https://x.com/EdBrio_info" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              @EdBrio_info
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 sm:gap-16 w-full md:w-auto">
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.productHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.features')}</a></li>
                <li><Link href="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.pricing')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.legalHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                <li><Link href="/legal?tab=sctl" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.sctl')}</Link></li>
                <li><Link href="/legal?tab=privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.privacy')}</Link></li>
                <li><Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 sm:mb-6">{t('footer.snsHeading')}</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                <li><a href="https://x.com/EdBrio_info" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest">
          <span>{t('footer.copyright')}</span>
        </div>
      </footer>
    </div>
  )
}
