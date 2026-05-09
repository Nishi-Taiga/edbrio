import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function LandingScreenshotWell() {
  const t = useTranslations('landing')

  return (
    <section className="-mt-4 sm:-mt-8">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-gray-950/5 p-2 ring-1 ring-gray-950/10 dark:bg-white/5 dark:ring-white/10">
          <div className="ring-inset-img overflow-hidden rounded-xl rounded-b-none">
            <picture>
              <source
                srcSet="/screenshots/10_teacher_dashboard-dark.png"
                media="(prefers-color-scheme: dark)"
              />
              <Image
                src="/screenshots/10_teacher_dashboard.png"
                alt={t('screenshots.teacherAlt')}
                width={1920}
                height={1080}
                className="w-full object-cover object-top"
                style={{ marginBottom: '-10px' }}
                priority
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  )
}
