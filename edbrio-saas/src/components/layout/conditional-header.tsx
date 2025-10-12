'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'

export function ConditionalHeader() {
  const pathname = usePathname()
  // Hide the global header on the landing page to avoid double headers.
  if (pathname === '/') return null
  return <Header />
}

