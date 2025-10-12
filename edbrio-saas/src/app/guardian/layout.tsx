import { notFound } from 'next/navigation'

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  // Gate all guardian pages in non-local environments unless explicitly enabled
  if (process.env.EDBRIO_ENABLE_SERVICE_PAGES !== 'true') {
    notFound()
  }
  return <>{children}</>
}

