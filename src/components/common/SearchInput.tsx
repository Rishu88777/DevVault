import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string }>(({ className, wrapperClassName, ...p }, ref) => (
  <div className={cn('relative', wrapperClassName)}>
    <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <input ref={ref} type="search" autoComplete="off" spellCheck={false}
      className={cn('h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0', className)} {...p} />
  </div>
))
SearchInput.displayName = 'SearchInput'
