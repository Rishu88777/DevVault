import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import type { ToolDefinition } from '@/data/tools'
import { useFavorites } from '@/hooks/usePrefs'
import { Tooltip } from '@/components/ui/tooltip'
import { PrivacyBadge } from './PrivacyBadge'
import { cn } from '@/lib/utils'

export function ToolHeader({ tool }: { tool: ToolDefinition }) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(tool.id)
  const Icon = tool.icon
  return (
    <header className="flex items-start gap-3.5">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-accent shadow-card"><Icon className="size-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{tool.category}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
        <p className="mt-1 text-muted-foreground">{tool.description}</p>
      </div>
      <Tooltip label={fav ? 'Remove from favorites' : 'Add to favorites'}>
        <button type="button" onClick={() => toggle(tool.id)} aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Star className={cn('size-5 transition-colors', fav && 'fill-warning text-warning')} />
        </button>
      </Tooltip>
    </header>
  )
}

export function HowItWorks({ tool }: { tool: ToolDefinition }) {
  return (
    <section aria-labelledby="how-it-works" className="rounded-xl border border-border bg-card/50 p-5">
      <h2 id="how-it-works" className="text-base font-semibold">{tool.howItWorks.title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {tool.howItWorks.body.map((p) => <p key={p}>{p}</p>)}
      </div>
    </section>
  )
}

/** Consistent frame: title → explanation → [tool UI] → privacy → how it works. */
export function ToolContainer({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="mx-auto w-full max-w-5xl space-y-6">
      <ToolHeader tool={tool} />
      {tool.sensitive && <PrivacyBadge sensitive />}
      <div className="space-y-5">{children}</div>
      {!tool.sensitive && <PrivacyBadge />}
      <HowItWorks tool={tool} />
    </motion.div>
  )
}
