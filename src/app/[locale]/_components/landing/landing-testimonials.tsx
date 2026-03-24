import { useTranslations } from 'next-intl'

export function LandingTestimonials() {
  const t = useTranslations('landing')

  const testimonials = [
    {
      quote: t('testimonials.quote1'),
      name: t('testimonials.name1'),
      title: t('testimonials.title1'),
      gradient: 'from-brand-700 to-brand-900',
    },
    {
      quote: t('testimonials.quote2'),
      name: t('testimonials.name2'),
      title: t('testimonials.title2'),
      gradient: 'from-brand-800 to-brand-950',
    },
    {
      quote: t('testimonials.quote3'),
      name: t('testimonials.name3'),
      title: t('testimonials.title3'),
      gradient: 'from-brand-600 to-brand-800',
    },
  ]

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('testimonials.eyebrow')}
        </p>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className={`relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-t ${item.gradient} p-6 text-white`}
            >
              <blockquote className="mb-4 text-base font-medium leading-relaxed text-white/90">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div>
                <p className="text-xs font-semibold text-white">{item.name}</p>
                <p className="text-xs text-white/60">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
