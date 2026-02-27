import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalHeader } from '@/components/layout/conditional-header'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeChooserDialog } from '@/components/ui/theme-chooser-dialog'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'EdBrio — AI報告書生成 × 生徒管理システム',
    template: '%s | EdBrio',
  },
  description:
    '家庭教師・個別指導講師のためのAI報告書生成＆生徒管理システム。授業メモを入力するだけで保護者向けレポートをAIが自動作成。予約・決済・カルテまで一元管理。',
  metadataBase: new URL('https://edbrio.com'),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'EdBrio',
    title: 'EdBrio — AI報告書生成 × 生徒管理システム',
    description:
      '家庭教師・個別指導講師のためのAI報告書生成＆生徒管理。授業メモからレポートをAIが自動作成。',
    url: 'https://edbrio.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EdBrio — AI報告書生成 × 生徒管理システム',
    description:
      '授業メモを入力するだけで保護者向けレポートをAIが自動作成。家庭教師・個別指導講師向け管理システム。',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeChooserDialog />
          <ConditionalHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
