'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export default function PricingPage() {
  const t = useTranslations('landing')
  const barsRef = useRef<HTMLDivElement>(null)
  const [barsRevealed, setBarsRevealed] = useState(false)

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

  // Bar animation observer
  useEffect(() => {
    if (!barsRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setBarsRevealed(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(barsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', lineBreak: 'strict' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        [data-reveal].revealed{opacity:1;transform:translateY(0)}
        [data-reveal][data-delay="1"]{transition-delay:.15s}
        [data-reveal][data-delay="2"]{transition-delay:.3s}
        [data-reveal][data-delay="3"]{transition-delay:.45s}
        .bar-animated{width:0;transition:width 1s cubic-bezier(.22,1,.36,1)}
        .bar-animated.bar-grow{width:var(--bar-target)}
      `}} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="EdBrio" width={140} height={36} className="h-8 sm:h-9 w-auto dark:brightness-0 dark:invert" priority />
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Link href="/" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition whitespace-nowrap">
              <ArrowLeft className="w-4 h-4" />
              {t('nav.features')}
            </Link>
            <Link href="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap">
              {t('nav.getStartedFree')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 sm:pt-36 pb-10 sm:pb-16 px-4 sm:px-6 bg-gradient-to-b from-brand-50/50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto text-center" data-reveal>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3 block">{t('sections.pricing')}</span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">{t('pricing.sectionTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto">{t('pricing.sectionDescription')}</p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 sm:p-10 border-2 border-slate-200 dark:border-slate-700 flex flex-col" data-reveal>
              <h3 className="text-lg font-bold text-slate-400 mb-2">{t('pricing.freePlan')}</h3>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6">{t('pricing.freePrice')}</div>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">{t('pricing.freeDescription')}</p>
              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {['freeStudents', 'freeReports', 'freeCalendar', 'freeKarte', 'freeStripe'].map((key) => (
                    <li key={key} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {t(`pricing.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition block text-sm">
                {t('pricing.freeCta')}
              </Link>
            </div>

            {/* Standard Plan */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-8 sm:p-10 flex flex-col relative text-white" data-reveal data-delay="1">
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-white/20 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">
                {t('pricing.standardTrialBadge')}
              </div>
              <h3 className="text-lg font-bold text-brand-200 mb-2">{t('pricing.standardPlan')}</h3>
              <div className="text-4xl sm:text-5xl font-black text-white mb-6">{t('pricing.standardPrice')}<span className="text-lg font-medium text-brand-200">{t('pricing.standardPriceUnit')}</span></div>
              <p className="text-brand-200 mb-8 text-xs sm:text-sm">{t('pricing.standardDescription')}</p>
              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {['standardStudents', 'standardReports', 'standardCalendar', 'standardKarte', 'standardStripe', 'standardChat', 'standardSupport'].map((key) => (
                    <li key={key} className="flex items-center gap-3 text-white/90 font-semibold text-sm">
                      <Check className="w-5 h-5 text-brand-200 shrink-0" /> {t(`pricing.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-white text-brand-600 font-bold text-center hover:bg-brand-50 transition block text-sm">
                {t('pricing.standardCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Structure */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-10" data-reveal>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6">{t('feeExplanation.title')}</h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('feeExplanation.description')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 sm:p-5" data-reveal data-delay="1">
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('feeExplanation.freePlanLabel')}</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{t('feeExplanation.freePlanTotal')}<span className="text-sm font-medium text-slate-400 ml-1">{t('feeExplanation.total')}</span></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('feeExplanation.freePlanBreakdown')}</div>
                  </div>
                  <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 sm:p-5 border border-brand-200 dark:border-brand-700" data-reveal data-delay="2">
                    <div className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-1">{t('feeExplanation.standardPlanLabel')}</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{t('feeExplanation.standardPlanTotal')}<span className="text-sm font-medium text-slate-400 ml-1">{t('feeExplanation.total')}</span></div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('feeExplanation.standardPlanBreakdown')}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-6" data-reveal>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">{t('feeExplanation.industryComparisonTitle')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">{t('feeExplanation.industryComparisonDescription')}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('feeExplanation.industryTakeHomeLabel')}</p>
                <div className="space-y-4 mb-6" ref={barsRef}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('feeExplanation.industryAgencyLabel')}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">{t('feeExplanation.industryAgencyRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`bg-red-300 dark:bg-red-500/60 h-3 rounded-full bar-animated ${barsRevealed ? 'bar-grow' : ''}`}
                        style={{ '--bar-target': '45%' } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('feeExplanation.industryAgencyNote')}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('feeExplanation.industryMatchingLabel')}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">{t('feeExplanation.industryMatchingRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`bg-amber-300 dark:bg-amber-500/60 h-3 rounded-full bar-animated ${barsRevealed ? 'bar-grow' : ''}`}
                        style={{ '--bar-target': '65%', transitionDelay: '0.2s' } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('feeExplanation.industryMatchingNote')}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t('feeExplanation.industryEdbrioLabel')}</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t('feeExplanation.industryEdbrioRate')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`bg-emerald-500 h-3 rounded-full bar-animated ${barsRevealed ? 'bar-grow' : ''}`}
                        style={{ '--bar-target': '95%', transitionDelay: '0.4s' } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('feeExplanation.industryEdbrioNote')}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 sm:p-5" data-reveal>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{t('feeExplanation.industryExampleTitle')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-300 mt-1.5 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{t('feeExplanation.industryExampleAgency')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-300 mt-1.5 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{t('feeExplanation.industryExampleMatching')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('feeExplanation.industryExampleEdbrio')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-16 px-4 sm:px-6" data-reveal>
        <div className="max-w-5xl mx-auto bg-brand-950 rounded-3xl px-8 sm:px-16 py-12 sm:py-16 text-center">
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
            <Link href="/#features" className="border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-sm sm:text-base transition hover:bg-white/10 text-center">
              {t('ctaBanner.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{t('footer.copyright')}</span>
          <div className="flex items-center gap-6">
            <Link href="/legal?tab=sctl" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.sctl')}</Link>
            <Link href="/legal?tab=privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.privacy')}</Link>
            <Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">{t('footer.contact')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
