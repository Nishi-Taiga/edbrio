import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ログイン・新規登録',
  description: 'EdBrioにログインまたは新規登録。家庭教師・個別指導講師のためのAI報告書生成＆生徒管理システム。',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
