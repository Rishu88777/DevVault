import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Home, Star } from 'lucide-react'
import { CATEGORIES } from '@/data/categories'
import { TOOLS, toolById, toolsByCategory } from '@/data/tools'
import { useCollapsedGroups, useFavorites } from '@/hooks/usePrefs'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const link = ({ isActive }: { isActive: boolean }) => cn('flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors', isActive ? 'bg-accent/10 font-medium text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground')

/** Navigation shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ collapsed = false, onNavigate, onExpand }: { collapsed?: boolean; onNavigate?: () => void; onExpand?: () => void }) {
  const { favorites } = useFavorites()
  const [closed, setClosed] = useCollapsedGroups()
  const { pathname } = useLocation()
  const favTools = favorites.map(toolById).filter(Boolean) as typeof TOOLS

  if (collapsed) {
    return (
      <nav aria-label="Tools" className="flex flex-col items-center gap-1 p-2">
        <Tooltip label="Home" className="w-full"><NavLink to="/" end aria-label="Home" className={(s) => cn(link(s), 'justify-center px-0')}><Home className="size-4" /></NavLink></Tooltip>
        {CATEGORIES.map((c) => {
          const active = toolsByCategory(c.id).some((t) => pathname === t.path)
          return <Tooltip key={c.id} label={c.id} className="w-full"><button onClick={onExpand} aria-label={`${c.id} — expand sidebar`} className={cn(link({ isActive: active }), 'w-full justify-center px-0')}><c.icon className="size-4" /></button></Tooltip>
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Tools" className="space-y-4 p-3">
      <NavLink to="/" end onClick={onNavigate} className={link}><Home className="size-4" /> Home</NavLink>
      {favTools.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70"><Star className="size-3 fill-warning text-warning" /> Favorites</p>
          <ul>{favTools.map((t) => <li key={t.id}><NavLink to={t.path} onClick={onNavigate} className={link}><t.icon className="size-4" /> <span className="truncate">{t.name}</span></NavLink></li>)}</ul>
        </div>
      )}
      {CATEGORIES.map((c) => {
        const isClosed = closed.includes(c.id)
        const tools = toolsByCategory(c.id)
        return (
          <div key={c.id}>
            <button type="button" aria-expanded={!isClosed} onClick={() => setClosed((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))}
              className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-foreground">
              <c.icon className="size-3.5" aria-hidden /> {c.id} <span className="font-normal opacity-60">{tools.length}</span>
              <ChevronDown className={cn('ml-auto size-3.5 transition-transform', isClosed && '-rotate-90')} aria-hidden />
            </button>
            <AnimatePresence initial={false}>
              {!isClosed && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                  {tools.map((t) => <li key={t.id}><NavLink to={t.path} onClick={onNavigate} className={link}><t.icon className="size-4 shrink-0" /> <span className="truncate">{t.name}</span></NavLink></li>)}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )
}

export function Sidebar({ collapsed, onExpand }: { collapsed: boolean; onExpand: () => void }) {
  return (
    <motion.aside initial={false} animate={{ width: collapsed ? 56 : 272 }} transition={{ duration: 0.2, ease: 'easeOut' }}
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-y-auto overflow-x-hidden border-r border-border bg-background lg:block">
      <SidebarNav collapsed={collapsed} onExpand={onExpand} />
    </motion.aside>
  )
}
