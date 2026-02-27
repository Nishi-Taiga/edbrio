'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { MobileSidebar } from './mobile-sidebar'

export function ConditionalHeader() {
  const pathname = usePathname()

  // Hide the global header on the landing page and admin routes.
  if (pathname === '/' || pathname?.startsWith('/admin')) return null

  const hasSidebar = pathname?.startsWith('/teacher') || pathname?.startsWith('/guardian')

  return (
    <>
      <Header showMenuButton={hasSidebar} />
      {hasSidebar && <MobileSidebar />}
    </>
  )
}
