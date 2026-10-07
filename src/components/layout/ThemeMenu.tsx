import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useTheme, type ThemePref } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeMenu() {
  const { pref, setPref, dark } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  const Icon = dark ? Moon : Sun
  return (
    <div ref={ref} className="relative">
      <Tooltip label="Theme"><Button variant="ghost" size="icon" aria-label="Change theme" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon /></Button></Tooltip>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" aria-label="Theme" initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lift">
            {OPTIONS.map((o) => (
              <button key={o.value} role="menuitemradio" aria-checked={pref === o.value} onClick={() => { setPref(o.value); setOpen(false) }}
                className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted', pref === o.value && 'text-accent')}>
                <o.icon className="size-4" /> {o.label} {pref === o.value && <Check className="ml-auto size-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
