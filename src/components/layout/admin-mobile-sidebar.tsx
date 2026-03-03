'use client'

import { useEffect } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { useSidebar } from './sidebar-context'

export function AdminMobileSidebar() {
  const { mobileOpen, closeMobile } = useSidebar()

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [mobileOpen, closeMobile])

  // Prevent body scroll when open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div className={`lg:hidden fixed top-16 left-0 right-0 bottom-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeMobile}
      />
      {/* Sidebar panel */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-60 bg-background border-r border-border-semantic shadow-lg transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <AdminSidebar onClose={closeMobile} />
      </div>
    </div>
  )
}
