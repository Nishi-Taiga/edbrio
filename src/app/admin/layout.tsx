import type { Metadata } from 'next'
import { AdminShell } from '@/components/layout/admin-shell'

export const metadata: Metadata = {
  title: { default: '管理者', template: '%s | EdBrio Admin' },
  robots: { index: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
