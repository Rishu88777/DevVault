import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Star } from 'lucide-react'
import type { ToolDefinition } from '@/data/tools'
import { useFavorites } from '@/hooks/usePrefs'
import { cn } from '@/lib/utils'

export const staggerParent = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
export const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } } }

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(tool.id)
  return (
    <motion.li variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="group relative">
      <Link to={tool.path} className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-accent/50 hover:shadow-lift">
        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-accent transition-colors group-hover:border-accent/40"><tool.icon className="size-[18px]" aria-hidden /></span>
        <span>
          <span className="block pr-6 font-medium leading-tight">{tool.name}</span>
          <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{tool.description}</span>
        </span>
      </Link>
      <button type="button" onClick={() => toggle(tool.id)} aria-pressed={fav} aria-label={`${fav ? 'Remove' : 'Add'} ${tool.name} ${fav ? 'from' : 'to'} favorites`}
        className={cn('absolute right-3 top-3 rounded p-1 text-muted-foreground/60 transition-all hover:text-foreground focus-visible:opacity-100', fav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <Star className={cn('size-4', fav && 'fill-warning text-warning')} />
      </button>
    </motion.li>
  )
}

export function ToolGrid({ tools }: { tools: ToolDefinition[] }) {
  return (
    <motion.ul variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((t) => <ToolCard key={t.id} tool={t} />)}
    </motion.ul>
  )
}
