import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, ClipboardPaste, Info, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ErrorMessage({ title, children, hints, action, className }: { title: string; children?: ReactNode; hints?: string[]; action?: ReactNode; className?: string }) {
  return (
    <motion.div role="alert" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
      className={cn('rounded-lg border border-danger/40 bg-danger/10 p-3.5 text-sm', className)}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-medium text-danger">{title}</p>
          {children && <p className="break-words text-foreground/80">{children}</p>}
          {hints && hints.length > 0 && (
            <div className="text-foreground/75">
              <p className="mb-1">Possible causes:</p>
              <ul className="list-disc space-y-0.5 pl-5">{hints.map((h) => <li key={h}>{h}</li>)}</ul>
            </div>
          )}
          {action && <div className="pt-1">{action}</div>}
        </div>
      </div>
    </motion.div>
  )
}

type NoticeTone = 'info' | 'warning'
export function Notice({ tone = 'info', title, children, className }: { tone?: NoticeTone; title?: string; children: ReactNode; className?: string }) {
  const Icon = tone === 'warning' ? ShieldAlert : Info
  return (
    <div className={cn('flex gap-2.5 rounded-lg border p-3 text-sm', tone === 'warning' ? 'border-warning/40 bg-warning/10' : 'border-border bg-muted/40', className)}>
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', tone === 'warning' ? 'text-warning' : 'text-muted-foreground')} />
      <div className="space-y-0.5 text-foreground/85">{title && <p className="font-medium text-foreground">{title}</p>}<div>{children}</div></div>
    </div>
  )
}

export function EmptyState({ title, hint, onPaste, className }: { title: string; hint?: string; onPaste?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-10 text-center', className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground/70">{hint}</p>}
      {onPaste && <Button size="sm" onClick={onPaste}><ClipboardPaste /> Paste from Clipboard</Button>}
    </div>
  )
}

export async function readClipboard(): Promise<string | null> {
  try { return await navigator.clipboard.readText() } catch { return null }
}
