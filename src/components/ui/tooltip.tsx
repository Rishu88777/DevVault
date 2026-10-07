import type { ReactNode } from 'react'
import { modKey } from '@/hooks/useShortcut'
import { cn } from '@/lib/utils'

/** CSS-only tooltip (shows on hover and keyboard focus). */
export function Tooltip({ label, shortcut, children, side = 'bottom', className }: { label: string; shortcut?: string; children: ReactNode; side?: 'top' | 'bottom'; className?: string }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span role="tooltip" className={cn('pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground opacity-0 shadow-lift transition-opacity delay-300 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100', side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5')}>
        {label}
        {shortcut && <kbd className="ml-2 rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground">{shortcut.replace('Mod', modKey)}</kbd>}
      </span>
    </span>
  )
}

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{children}</kbd>
)
