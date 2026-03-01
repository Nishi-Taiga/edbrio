import { AlertCircle } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  onRetry?: () => void
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="mb-4 p-3 flex items-start gap-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-400" role="alert">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 underline underline-offset-2 font-medium hover:text-red-800 dark:hover:text-red-300 transition"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  )
}
