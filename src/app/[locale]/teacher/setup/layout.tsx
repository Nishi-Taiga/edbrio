import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '初期設定',
  robots: { index: false },
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <span className="text-xl font-bold text-brand-600 dark:text-brand-400">EdBrio</span>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
