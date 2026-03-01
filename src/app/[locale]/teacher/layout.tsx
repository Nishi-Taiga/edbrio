import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: '講師ダッシュボード', template: '%s | EdBrio 講師' },
  robots: { index: false },
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
