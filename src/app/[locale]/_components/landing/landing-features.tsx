import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function LandingFeatures() {
  const t = useTranslations('landing')

  const features = [
    {
      eyebrow: 'AI REPORTS',
      title: t('features.aiReportTitle'),
      description: t('features.aiReportDescription'),
      screenshot: '/screenshots/14_teacher_reports.png',
      screenshotDark: '/screenshots/14_teacher_reports-dark.png',
      alt: t('features.aiReportTitle'),
    },
    {
      eyebrow: 'SCHEDULING',
      title: t('features.schedulingTitle'),
      description: t('features.schedulingDescription'),
      screenshot: '/screenshots/11_teacher_calendar.png',
      screenshotDark: '/screenshots/11_teacher_calendar-dark.png',
      alt: t('features.schedulingTitle'),
    },
  ]

  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        {/* Section heading - inline style */}
        <div className="mb-12">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('sections.features')}
          </p>
          <p className="max-w-[40ch] text-3xl font-[550] tracking-tight text-pretty sm:text-4xl">
            <span className="text-foreground">{t('features.sectionTitle1')}</span>
            <span className="font-medium text-muted-foreground">{t('features.sectionTitle2')}</span>
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.eyebrow}
              className="overflow-hidden rounded-2xl bg-gray-950/5 ring-1 ring-gray-950/10 dark:bg-white/5 dark:ring-white/10"
            >
              {/* Screenshot */}
              <div className="ring-inset-img overflow-hidden rounded-xl m-2 mb-0">
                <picture>
                  <source
                    srcSet={feature.screenshotDark}
                    media="(prefers-color-scheme: dark)"
                  />
                  <Image
                    src={feature.screenshot}
                    alt={feature.alt}
                    width={1200}
                    height={800}
                    className="w-full object-cover object-top"
                  />
                </picture>
              </div>

              {/* Text */}
              <div className="p-5 pt-4">
                <p className="mb-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {feature.eyebrow}
                </p>
                <p className="max-w-[40ch] text-lg text-pretty">
                  <span className="font-[550] text-foreground">{feature.title}。</span>
                  <span className="font-medium text-muted-foreground">{feature.description}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
