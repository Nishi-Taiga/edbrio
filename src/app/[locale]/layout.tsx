import type { Metadata } from "next";
import { ConditionalHeader } from '@/components/layout/conditional-header';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeChooserDialog } from '@/components/ui/theme-chooser-dialog';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      default: t('defaultTitle'),
      template: '%s | EdBrio',
    },
    description: t('description'),
    metadataBase: new URL('https://edbrio.com'),
    openGraph: {
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : locale,
      siteName: 'EdBrio',
      title: t('defaultTitle'),
      description: t('ogDescription'),
      url: 'https://edbrio.com',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('defaultTitle'),
      description: t('twitterDescription'),
    },
    robots: { index: true, follow: true },
    icons: { icon: '/icon.svg' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Toaster position="top-right" richColors closeButton duration={3000} />
        <ThemeChooserDialog />
        <SidebarProvider>
          <ConditionalHeader />
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
