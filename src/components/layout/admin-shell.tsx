'use client'

import { AdminSidebar } from './admin-sidebar'

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden lg:block fixed top-16 bottom-0 left-0 w-60 border-r bg-background/80 dark:bg-brand-950/80 dark:border-brand-800/30 backdrop-blur z-30">
        <AdminSidebar />
      </div>
      <div className="lg:pl-60">
        {children}
      </div>
    </>
  )
}
