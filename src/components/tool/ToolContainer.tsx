import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { categoryById } from '@/data/categories'
import { toolFaq, toolsByCategory, type ToolDefinition } from '@/data/tools'
import { useFavorites } from '@/hooks/usePrefs'
import { Tooltip } from '@/components/ui/tooltip'
import { PrivacyBadge } from './PrivacyBadge'
import { cn } from '@/lib/utils'

export function ToolHeader({ tool }: { tool: ToolDefinition }) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(tool.id)
  const Icon = tool.icon
  const col = categoryById(tool.category).color
  return (
    <header className="flex items-start gap-3">
      <span className={'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ' + col.icon}><Icon className="size-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.name}</h1>
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

export function Faq({ tool }: { tool: ToolDefinition }) {
  return (
    <section aria-labelledby="faq" className="space-y-3">
      <h2 id="faq" className="text-base font-semibold">Frequently asked questions</h2>
      <dl className="space-y-3 text-sm">
        {toolFaq(tool).map((f) => <div key={f.q}><dt className="font-medium">{f.q}</dt><dd className="mt-0.5 text-muted-foreground">{f.a}</dd></div>)}
      </dl>
    </section>
  )
}

export function RelatedTools({ tool }: { tool: ToolDefinition }) {
  const related = toolsByCategory(tool.category).filter((t) => t.id !== tool.id).slice(0, 8)
  if (related.length === 0) return null
  return (
    <nav aria-label="Related tools" className="space-y-2">
      <h2 className="text-sm font-semibold">More {tool.category} tools</h2>
      <ul className="flex flex-wrap gap-2">{related.map((t) => <li key={t.id}><Link to={t.path} className="inline-block rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground">{t.name}</Link></li>)}</ul>
    </nav>
  )
}

/** Consistent frame: title → explanation → [tool UI] → privacy → how it works. */
export function ToolContainer({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="mx-auto w-full space-y-6">
      <ToolHeader tool={tool} />
      {tool.sensitive && <PrivacyBadge sensitive />}
      <div className="space-y-5">{children}</div>
      {!tool.sensitive && <PrivacyBadge />}
      <HowItWorks tool={tool} />
      <Faq tool={tool} />
      <RelatedTools tool={tool} />
    </motion.div>
  )
}
