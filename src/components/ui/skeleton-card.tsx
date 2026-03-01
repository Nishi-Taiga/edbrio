function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`} />
}

/** Skeleton for a stat/metric card (dashboard) */
export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-brand-800/20 bg-white dark:bg-surface-raised p-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/** Skeleton for a list/card item (bookings, reports, etc.) */
export function SkeletonListCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-brand-800/20 bg-white dark:bg-surface-raised p-5">
      <Skeleton className="h-4 w-40 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

/** Skeleton for a grid of ticket/product cards */
export function SkeletonProductCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-brand-800/20 bg-white dark:bg-surface-raised p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4 mb-4" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  )
}

/** Loading grid for dashboard stat cards */
export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

/** Loading list for booking/report items */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListCard key={i} />
      ))}
    </div>
  )
}
