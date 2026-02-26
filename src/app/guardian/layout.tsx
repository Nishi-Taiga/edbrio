import { Sidebar } from '@/components/layout/sidebar'

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop sidebar: appears below header (top-16) */}
      <div className="hidden lg:block fixed top-16 bottom-0 left-0 w-64 border-r bg-background/80 dark:bg-brand-950/80 dark:border-brand-800/30 backdrop-blur">
        <Sidebar />
      </div>
      {/* Content offset for sidebar on desktop */}
      <div className="lg:pl-64">{children}</div>
    </>
  )
}

