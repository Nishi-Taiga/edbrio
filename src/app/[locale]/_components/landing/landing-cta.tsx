import { useTranslations } from 'next-intl'
import { PreRegisterForm } from '@/app/[locale]/_components/landing/pre-register-form'

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
          <PreRegisterForm location="bottom_cta" />
        </div>
      </div>
    </section>
  )
}
