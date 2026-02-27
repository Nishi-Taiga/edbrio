import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  trend?: number // percentage change vs previous period
}

export function KpiCard({ title, value, description, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-600 dark:text-slate-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span className={trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
            {description && <span className="text-gray-500 dark:text-gray-400">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
