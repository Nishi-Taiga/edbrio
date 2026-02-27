'use client'

import { useEffect } from 'react'
import { Sidebar } from './sidebar'
import { useSidebar } from './sidebar-context'

export function MobileSidebar() {
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
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeMobile}
      />
      {/* Sidebar panel */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-64 bg-background border-r border-border-semantic shadow-lg transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar mobile onClose={closeMobile} />
      </div>
    </div>
  )
}
