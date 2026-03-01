import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { AdminShell } from '@/components/layout/admin-shell'
import { Toaster } from 'sonner'
import messages from '../../../messages/ja.json'

export const metadata: Metadata = {
  title: { default: '管理者', template: '%s | EdBrio Admin' },
  robots: { index: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={messages} locale="ja">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Toaster position="top-right" richColors closeButton duration={3000} />
        <SidebarProvider>
          <AdminShell>{children}</AdminShell>
        </SidebarProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
