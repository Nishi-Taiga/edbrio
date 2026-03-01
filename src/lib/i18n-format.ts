export function formatYen(amount: number, locale: string = 'ja'): string {
  return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : locale, {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatYenFromCents(cents: number, locale: string = 'ja'): string {
  return formatYen(Math.round((cents || 0) / 100), locale);
}
