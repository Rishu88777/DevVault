import type { ReactNode } from 'react'
import { categoryById, type CategoryId } from '@/data/categories'
import { cn } from '@/lib/utils'

/** Coloured card with a header strip — used for paired Encrypt/Decrypt, Encode/Decode panels. */
export function Panel({ title, category, children, className }: { title: string; category: CategoryId; children: ReactNode; className?: string }) {
  const c = categoryById(category).color
  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-card', className)}>
      <div className={cn('h-1', c.bar)} aria-hidden />
      <h2 className={cn('px-5 py-3 text-center text-base font-semibold', c.header)}>{title}</h2>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}
