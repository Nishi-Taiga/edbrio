'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Menu, X } from 'lucide-react'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { CtaButton } from '@/app/[locale]/_components/landing/cta-link'

export function LandingNavbar() {
  const t = useTranslations('landing')
  const tCommon = useTranslations('common')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 sm:px-6">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <EdBrioLogo size={28} />
            <span className="text-foreground">EdBrio</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#features"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('nav.features')}
            </a>
            <Link
              href="/pricing"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('nav.pricing')}
            </Link>
          </nav>
        </div>

        {/* Right: Language, Login, CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher className="text-sm" />
          <Link
            href="/auth/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tCommon('login')}
          </Link>
          <CtaButton href="/auth/signup" location="navbar" className="h-7 px-4 text-xs">
            {tCommon('freeRegister')}
          </CtaButton>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="rounded-md p-2 text-muted-foreground md:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-950/10 px-5 pb-4 pt-3 dark:border-white/10 md:hidden">
          <nav className="flex flex-col gap-2">
            <a
              href="#features"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.features')}
            </a>
            <Link
              href="/pricing"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href="/auth/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {tCommon('login')}
            </Link>
            <div className="flex items-center gap-3 pt-2">
              <LanguageSwitcher className="text-sm" />
              <CtaButton href="/auth/signup" location="navbar_mobile" className="h-8 flex-1 text-xs">
                {tCommon('freeRegister')}
              </CtaButton>
            </div>
          </nav>
        </div>
      )}

      {/* Bottom border using ring pattern */}
      <div className="h-px w-full bg-gray-950/10 dark:bg-white/10" />
    </header>
  )
}
