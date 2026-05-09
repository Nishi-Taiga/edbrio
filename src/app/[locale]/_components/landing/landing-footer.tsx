import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'

export function LandingFooter() {
  const t = useTranslations('landing')

  const columns = [
    {
      heading: t('footer.productHeading'),
      links: [
        { label: t('footer.features'), href: '#features' },
        { label: t('footer.pricing'), href: '/pricing' },
      ],
    },
    {
      heading: t('footer.legalHeading'),
      links: [
        { label: t('footer.sctl'), href: '/legal/sctl' },
        { label: t('footer.privacy'), href: '/legal/privacy' },
        { label: t('footer.contact'), href: '/contact' },
      ],
    },
    {
      heading: t('footer.snsHeading'),
      links: [
        { label: 'X (Twitter)', href: 'https://x.com/edbrio_jp', external: true },
      ],
    },
  ]

  return (
    <footer className="border-t border-gray-950/10 dark:border-white/10">
      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Logo column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <EdBrioLogo size={24} />
              <span className="text-sm font-bold text-foreground">EdBrio</span>
            </div>
            <p className="mt-3 max-w-[30ch] text-xs text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-950/5 pt-6 dark:border-white/5">
          <p className="text-xs text-muted-foreground">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
