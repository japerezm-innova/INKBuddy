import { forwardRef, InputHTMLAttributes } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn, glass } from '@/shared/lib/utils'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, icon: Icon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-dark/80"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-dark/40 pointer-events-none"
              aria-hidden="true"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              glass.input,
              'w-full h-11 px-4 text-sm text-ink-dark outline-none',
              Icon && 'pl-10',
              error && 'border-red-400/60 focus:border-red-400/80 focus:ring-red-300/20',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-500 font-medium"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'
