import { useTranslations } from 'next-intl'

export function LandingStats() {
  const t = useTranslations('landing')

  const stats = [
    { value: t('stats.stat1Value'), label: t('stats.stat1Label') },
    { value: t('stats.stat2Value'), label: t('stats.stat2Label') },
    { value: t('stats.stat3Value'), label: t('stats.stat3Label') },
  ]

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <div className="grid grid-cols-1 divide-y divide-gray-950/10 dark:divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-0 py-4 first:pt-0 last:pb-0 sm:px-8 sm:py-0 sm:first:pl-0 sm:last:pr-0">
              <p className="text-4xl font-[550] tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
