import { useTranslations } from 'next-intl'
import { CtaButton } from '@/app/[locale]/_components/landing/cta-link'
import { PreRegisterForm } from '@/app/[locale]/_components/landing/pre-register-form'

const isPreLaunch = process.env.NEXT_PUBLIC_PRE_LAUNCH === 'true'

export function LandingCta() {
  const t = useTranslations('landing')

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <h2 className="max-w-[30ch] text-3xl font-[550] tracking-tight text-foreground text-balance sm:text-4xl">
          {t('cta.title')}
        </h2>
        <p className="mt-3 max-w-[50ch] text-base font-medium text-muted-foreground text-pretty">
          {t('cta.description')}
        </p>
        <div className="mt-6 max-w-md">
          {isPreLaunch ? (
            <PreRegisterForm location="bottom_cta" />
          ) : (
            <div className="flex flex-wrap gap-3">
              <CtaButton href="/auth/signup" location="bottom_cta">
                {t('cta.primary')}
              </CtaButton>
              <CtaButton href="/pricing" location="bottom_cta_pricing" variant="secondary">
                {t('cta.secondary')}
              </CtaButton>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
