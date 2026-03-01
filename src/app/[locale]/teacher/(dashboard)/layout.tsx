import { DashboardShell } from '@/components/layout/dashboard-shell'

export default function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
