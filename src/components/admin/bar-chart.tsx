interface BarChartItem {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartItem[]
  formatValue?: (value: number) => string
}

export function BarChart({ data, formatValue = (v) => String(v) }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((item) => {
        const height = (item.value / max) * 100
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
              {formatValue(item.value)}
            </span>
            <div className="w-full relative" style={{ height: '120px' }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-brand-500 dark:bg-brand-400 rounded-t transition-all"
                style={{ height: `${height}%`, minHeight: item.value > 0 ? '4px' : '0px' }}
              />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
