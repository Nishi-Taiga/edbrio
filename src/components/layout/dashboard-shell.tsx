'use client'

import { Sidebar } from './sidebar'
import { useSidebar } from './sidebar-context'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { desktopOpen } = useSidebar()

  return (
    <>
      {/* Desktop sidebar with slide animation */}
      <div
        className={`hidden lg:block fixed top-16 bottom-0 left-0 w-64 border-r bg-background/80 dark:bg-brand-950/80 dark:border-brand-800/30 backdrop-blur transition-transform duration-300 ease-in-out z-30 ${
          desktopOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>
      {/* Content with animated offset */}
      <div className={`transition-all duration-300 ease-in-out ${desktopOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
        {children}
      </div>
    </>
  )
}
