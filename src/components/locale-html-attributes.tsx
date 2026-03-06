'use client';

import { useEffect } from 'react';

const rtlLocales = ['ar'];

export function LocaleHtmlAttributes({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  }, [locale]);
  return null;
}
