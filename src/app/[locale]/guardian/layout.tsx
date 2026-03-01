import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export const metadata: Metadata = {
  title: { default: '保護者ダッシュボード', template: '%s | EdBrio 保護者' },
  robots: { index: false },
}

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
