import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export const metadata: Metadata = {
  title: { default: '講師ダッシュボード', template: '%s | EdBrio 講師' },
  robots: { index: false },
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
