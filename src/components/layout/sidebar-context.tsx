'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface SidebarContextValue {
  desktopOpen: boolean
  mobileOpen: boolean
  toggleDesktop: () => void
  toggleMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  desktopOpen: true,
  mobileOpen: false,
  toggleDesktop: () => {},
  toggleMobile: () => {},
  closeMobile: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleDesktop = useCallback(() => setDesktopOpen(prev => !prev), [])
  const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <SidebarContext.Provider value={{ desktopOpen, mobileOpen, toggleDesktop, toggleMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
