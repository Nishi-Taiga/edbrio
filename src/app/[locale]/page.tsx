import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import { LandingNavbar } from '@/app/[locale]/_components/landing/landing-navbar'
import { LandingHero } from '@/app/[locale]/_components/landing/landing-hero'
import { LandingScreenshotWell } from '@/app/[locale]/_components/landing/landing-screenshot-well'
import { LandingLogoCloud } from '@/app/[locale]/_components/landing/landing-logo-cloud'
import { LandingFeatures } from '@/app/[locale]/_components/landing/landing-features'
import { LandingStats } from '@/app/[locale]/_components/landing/landing-stats'
import { LandingTestimonials } from '@/app/[locale]/_components/landing/landing-testimonials'
import { LandingCta } from '@/app/[locale]/_components/landing/landing-cta'
import { LandingFooter } from '@/app/[locale]/_components/landing/landing-footer'
import { PreRegisterConfirmedToast } from '@/app/[locale]/_components/landing/pre-register-confirmed-toast'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export default function HomePage() {
  return (
    <div className={`${inter.variable} landing-type canvas-grid`}>
      <LandingNavbar />

      <Suspense>
        <PreRegisterConfirmedToast />
      </Suspense>

      <main>
        <LandingHero />
        <LandingScreenshotWell />

        {/* Horizontal divider */}
        <div className="h-px w-full bg-gray-950/10 dark:bg-white/10" />

        <LandingLogoCloud />

        <div className="h-px w-full bg-gray-950/10 dark:bg-white/10" />

        <LandingFeatures />

        <div className="h-px w-full bg-gray-950/10 dark:bg-white/10" />

        <LandingStats />

        <div className="h-px w-full bg-gray-950/10 dark:bg-white/10" />

        <LandingTestimonials />

        <div className="h-px w-full bg-gray-950/10 dark:bg-white/10" />

        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  )
}
