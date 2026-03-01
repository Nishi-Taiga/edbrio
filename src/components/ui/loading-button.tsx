import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

export function LoadingButton({ loading, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
      {children}
    </Button>
  )
}
