import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-brand-600 dark:text-brand-400 mb-4">{t('code')}</p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          {t('description')}
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-8 py-3 rounded-xl font-bold text-sm transition"
        >
          {t('homeLink')}
        </Link>
      </div>
    </div>
  )
}
