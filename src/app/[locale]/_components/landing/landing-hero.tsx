import { useTranslations } from 'next-intl'
import { CtaButton } from '@/app/[locale]/_components/landing/cta-link'

export function LandingHero() {
  const t = useTranslations('landing')

  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
          {/* Left: Headline */}
          <div>
            <h1 className="max-w-[18ch] text-4xl font-[550] tracking-tighter text-foreground text-pretty sm:text-5xl lg:text-6xl">
              {t('hero.title1')}
              {t('hero.title2')}
            </h1>
          </div>

          {/* Right: Subtext + CTA */}
          <div className="flex flex-col gap-6 lg:pt-2">
            <p className="max-w-[40ch] text-lg font-medium text-muted-foreground text-pretty">
              {t('hero.description')}
            </p>
            <div className="flex flex-wrap gap-3">
              <CtaButton href="/auth/signup" location="hero_primary">
                {t('hero.ctaStart')}
              </CtaButton>
              <CtaButton href="#features" location="hero_secondary" variant="secondary">
                {t('hero.ctaFeatures')}
              </CtaButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
