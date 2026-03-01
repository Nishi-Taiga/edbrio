import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ja', 'en', 'fr', 'es', 'it', 'sv', 'ru', 'zh', 'ko'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
