'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './header'
import { MobileSidebar } from './mobile-sidebar'

export function ConditionalHeader() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleToggle = useCallback(() => setSidebarOpen(prev => !prev), [])
  const handleClose = useCallback(() => setSidebarOpen(false), [])

  // Hide the global header on the landing page to avoid double headers.
  if (pathname === '/') return null

  const hasSidebar = pathname?.startsWith('/teacher') || pathname?.startsWith('/guardian')

  return (
    <>
      <Header onMenuToggle={handleToggle} showMenuButton={hasSidebar} />
      {hasSidebar && <MobileSidebar open={sidebarOpen} onClose={handleClose} />}
    </>
  )
}
