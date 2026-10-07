import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { CATEGORIES } from '@/data/categories'
import { toolsByCategory } from '@/data/tools'
import { Button } from '@/components/ui/button'

/** "All tools" mega menu: every tool grouped by category. */
export function AllToolsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="sm" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>All tools <ChevronDown className="size-3.5" /></Button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 grid w-[min(52rem,92vw)] gap-x-6 gap-y-5 rounded-xl border border-border bg-card p-5 shadow-lift sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.id}>
                <Link to={`/category/${c.id}`} onClick={() => setOpen(false)} className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider hover:opacity-80 ${c.color.text}`}><c.icon className="size-3.5" /> {c.id}</Link>
                <ul>{toolsByCategory(c.id).map((t) => <li key={t.id}><Link to={t.path} onClick={() => setOpen(false)} className="block truncate rounded px-1.5 py-1 text-sm text-foreground/85 hover:bg-muted hover:text-foreground">{t.name}</Link></li>)}</ul>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
