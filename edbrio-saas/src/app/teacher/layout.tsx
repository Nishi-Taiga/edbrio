import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  // Gate all teacher pages in non-local environments unless explicitly enabled
  if (process.env.EDBRIO_ENABLE_SERVICE_PAGES !== 'true') {
    notFound()
  }
  return (
    <>
      {/* Desktop sidebar: appears below header (top-16) */}
      <div className="hidden lg:block fixed top-16 bottom-0 left-0 w-64 border-r bg-white/80 dark:bg-gray-950/80 dark:border-gray-800 backdrop-blur">
        <Sidebar />
      </div>
      {/* Content offset for sidebar on desktop */}
      <div className="lg:pl-64">{children}</div>
    </>
  )
}

