import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CornerDownLeft, Search } from 'lucide-react'
import { TOOLS, popularTools, toolById, type ToolDefinition } from '@/data/tools'
import { useRecent } from '@/hooks/usePrefs'
import { useShortcut } from '@/hooks/useShortcut'
import { rank } from '@/lib/search'
import { Kbd } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PaletteCtx { open: (query?: string) => void; close: () => void; isOpen: boolean }
const Ctx = createContext<PaletteCtx>({ open: () => {}, close: () => {}, isOpen: false })
export const usePalette = () => useContext(Ctx)

export function searchTools(query: string): ToolDefinition[] {
  return rank(TOOLS, query, (t) => [
    { text: t.name, weight: 3 }, { text: t.keywords.join(' '), weight: 1.6 }, { text: t.category, weight: 1 }, { text: t.description, weight: 0.8 },
  ])
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [initial, setInitial] = useState('')
  const open = useCallback((q = '') => { setInitial(q); setOpen(true) }, [])
  const close = useCallback(() => setOpen(false), [])
  useShortcut({ key: 'k', mod: true }, () => setOpen((o) => !o))
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen])
  return (
    <Ctx.Provider value={value}>
      {children}
      <AnimatePresence>{isOpen && <Palette key="palette" initialQuery={initial} onClose={close} />}</AnimatePresence>
    </Ctx.Provider>
  )
}

function Palette({ initialQuery, onClose }: { initialQuery: string; onClose: () => void }) {
  const [query, setQuery] = useState(initialQuery)
  const [active, setActive] = useState(0)
  const nav = useNavigate()
  const { recent } = useRecent()
  const listRef = useRef<HTMLUListElement>(null)
  const prev = useRef<HTMLElement | null>(null)

  useEffect(() => {
    prev.current = document.activeElement as HTMLElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow; prev.current?.focus?.() }
  }, [])

  const results = useMemo(() => {
    if (query.trim()) return searchTools(query).slice(0, 30)
    const recents = recent.map(toolById).filter((t): t is ToolDefinition => !!t)
    return [...recents, ...popularTools().filter((t) => !recent.includes(t.id))].slice(0, 12)
  }, [query, recent])
  const heading = query.trim() ? 'Tools' : recent.length ? 'Recent & popular' : 'Popular tools'

  useEffect(() => setActive(0), [query])
  useEffect(() => { listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' }) }, [active])

  const go = (t: ToolDefinition | undefined) => { if (!t) return; onClose(); nav(t.path) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div role="dialog" aria-modal="true" aria-label="Search tools" onKeyDown={onKey}
        initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -8 }} transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-lift">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools…" aria-label="Search tools" role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            className="h-12 flex-1 bg-transparent text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70" />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" aria-label={heading} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No tools match “{query}”.</li>}
          {results.length > 0 && <li role="presentation" className="px-2 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{heading}</li>}
          {results.map((t, i) => (
            <li key={t.id} id={`palette-${t.id}`} role="option" aria-selected={i === active} data-idx={i} onMouseMove={() => setActive(i)} onClick={() => go(t)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2', i === active && 'bg-muted')}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-accent"><t.icon className="size-4" aria-hidden /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{t.name}</span><span className="block truncate text-xs text-muted-foreground">{t.description}</span></span>
              <span className="text-xs text-muted-foreground">{t.category}</span>
              {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate</span><span><Kbd>↵</Kbd> open</span><span className="ml-auto">🔒 Search runs locally</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
