import { useTranslations } from 'next-intl'
import { PreRegisterForm } from '@/app/[locale]/_components/landing/pre-register-form'

export function LandingHero() {
  const t = useTranslations('landing')

  return (
    <section id="hero" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
          {/* Left: Headline */}
          <div>
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t('hero.launchBadge')}
            </span>
            <h1 className="max-w-[18ch] text-4xl font-[550] tracking-tighter text-foreground text-pretty sm:text-5xl lg:text-6xl">
              {t('hero.title1')}
              {t('hero.title2')}
            </h1>
          </div>

          {/* Right: Subtext + Pre-register */}
          <div className="flex flex-col gap-6 lg:pt-2">
            <p className="max-w-[40ch] text-lg font-medium text-muted-foreground text-pretty">
              {t('hero.description')}
            </p>
            <PreRegisterForm location="hero" />
          </div>
        </div>
      </div>
    </section>
  )
}
