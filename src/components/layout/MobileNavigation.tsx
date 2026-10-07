import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/common/Logo'
import { SidebarNav } from './Sidebar'

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <motion.div className="absolute inset-0 bg-background/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.div role="dialog" aria-modal="true" aria-label="Navigation" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[85vw] flex-col border-r border-border bg-background shadow-lift">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="flex items-center gap-2 font-semibold"><LogoMark /> DevCipher</span>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation" autoFocus><X /></Button>
            </div>
            <div className="flex-1 overflow-y-auto"><SidebarNav onNavigate={onClose} /></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
