import { useId } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string> { value: T; label: string }

/** Segmented tabs with a smoothly animated active indicator. */
export function Tabs<T extends string>({ value, onChange, items, label, className }: { value: T; onChange: (v: T) => void; items: TabItem<T>[]; label: string; className?: string }) {
  const id = useId()
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex flex-wrap rounded-lg border border-border bg-muted/50 p-0.5', className)}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button key={t.value} role="tab" type="button" aria-selected={active} onClick={() => onChange(t.value)}
            className={cn('relative rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors', active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-md border border-border bg-card shadow-card" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Compact pill selector for short option lists (e.g. Plain Text / Base64 / Hex). */
export function Pills<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: TabItem<T>[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <button key={t.value} type="button" role="radio" aria-checked={t.value === value} onClick={() => onChange(t.value)}
          className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', t.value === value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:text-foreground')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
