'use client'

import { useEffect } from 'react'
import { Sidebar } from './sidebar'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className={`lg:hidden fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Sidebar panel */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-64 bg-background border-r border-border-semantic shadow-lg transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar mobile onClose={onClose} />
      </div>
    </div>
  )
}
