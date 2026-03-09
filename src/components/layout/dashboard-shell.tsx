'use client'

import { Sidebar } from './sidebar'
import { useSidebar } from './sidebar-context'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { desktopOpen } = useSidebar()

  return (
    <>
      {/* Desktop sidebar with width animation */}
      <div
        className={`hidden md:block fixed top-14 bottom-0 left-0 overflow-hidden border-r border-[#3D2B5E] dark:border-[#1A1726] bg-[#2D1B4E] dark:bg-[#0F0D18] transition-all duration-300 ease-in-out z-30 ${
          desktopOpen ? 'w-60' : 'w-16'
        }`}
      >
        <Sidebar collapsed={!desktopOpen} />
      </div>
      {/* Content with animated offset + bottom padding for mobile footer */}
      <div className={`transition-all duration-300 ease-in-out pb-20 md:pb-0 ${desktopOpen ? 'md:pl-60' : 'md:pl-16'}`}>
        {children}
      </div>
    </>
  )
}
