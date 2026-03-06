'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from './admin-sidebar'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Admin header */}
      <header className="sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur flex items-center px-4 gap-3">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-semibold text-sm">EdBrio 管理パネル</span>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r">
            <AdminSidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed top-14 bottom-0 left-0 w-64 border-r bg-background/80 backdrop-blur z-30">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  )
}
