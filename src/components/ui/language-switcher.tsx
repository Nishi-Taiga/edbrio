'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Globe } from 'lucide-react';

const localeLabels: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  sv: 'Svenska',
  ru: 'Русский',
  zh: '中文',
  ko: '한국어',
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value });
  }

  return (
    <div className={`relative inline-flex items-center ${className ?? ''}`}>
      <Globe className="absolute left-2 w-4 h-4 text-slate-400 pointer-events-none" />
      <select
        value={locale}
        onChange={onSelectChange}
        className="appearance-none bg-transparent border border-slate-200 dark:border-brand-800/30 rounded-lg pl-7 pr-6 py-1.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-brand-900/20 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-label="Language"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc]}
          </option>
        ))}
      </select>
      <svg className="absolute right-1.5 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
