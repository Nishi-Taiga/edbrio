import { ja, enUS, fr, es, it, sv, ru, zhCN, ko } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const dateFnsLocales: Record<string, Locale> = {
  ja,
  en: enUS,
  fr,
  es,
  it,
  sv,
  ru,
  zh: zhCN,
  ko,
};

export function getDateFnsLocale(locale: string): Locale {
  return dateFnsLocales[locale] || ja;
}
