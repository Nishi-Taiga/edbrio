'use client'

import { Sidebar } from './sidebar'
import { useSidebar } from './sidebar-context'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { desktopOpen } = useSidebar()

  return (
    <>
      {/* Desktop sidebar with width animation */}
      <div
        className={`hidden md:block fixed top-16 bottom-0 left-0 overflow-hidden border-r bg-background/80 dark:bg-brand-950/80 dark:border-brand-800/30 backdrop-blur transition-all duration-300 ease-in-out z-30 ${
          desktopOpen ? 'w-64' : 'w-16'
        }`}
      >
        <Sidebar collapsed={!desktopOpen} />
      </div>
      {/* Content with animated offset + bottom padding for mobile footer */}
      <div className={`transition-all duration-300 ease-in-out pb-20 md:pb-0 ${desktopOpen ? 'md:pl-64' : 'md:pl-16'}`}>
        {children}
      </div>
    </>
  )
}
