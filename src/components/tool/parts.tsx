import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ClipboardPaste } from 'lucide-react'
import { Textarea } from '@/components/ui/fields'
import { Button } from '@/components/ui/button'
import { ClearButton, DownloadButton } from '@/components/common/ActionButtons'
import { CopyButton } from '@/components/common/CopyButton'
import { EmptyState, ErrorMessage, readClipboard } from '@/components/common/Feedback'
import { CodeView } from '@/components/common/CodeEditor'
import { useShortcut } from '@/hooks/useShortcut'
import { cn } from '@/lib/utils'

/** A labelled section of a tool: step 1 (input), 2 (options), 3 (output)… keeps every tool visually identical. */
export function ToolSection({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <div className="flex items-center gap-1">{actions}</div>
      </div>
      {children}
    </section>
  )
}

/** Input textarea with an empty-state "Paste from Clipboard" affordance. */
export function ToolInput({ label, value, onChange, placeholder, rows = 8, emptyHint, actions, className, mono = true, onClear }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; emptyHint?: string
  actions?: ReactNode; className?: string; mono?: boolean; onClear?: () => void
}) {
  const paste = async () => { const t = await readClipboard(); if (t !== null) onChange(t) }
  return (
    <ToolSection title={label} actions={<>{actions}{!value && <Button size="sm" variant="ghost" onClick={paste}><ClipboardPaste /> Paste</Button>}{value && onClear && <ClearButton onClick={onClear} shortcut={false} />}</>} className={className}>
      <Textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={emptyHint ?? placeholder} rows={rows} className={cn(!mono && 'font-sans text-sm')} />
    </ToolSection>
  )
}

/** Options row between input and action. */
export function ToolSettings({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-end gap-x-4 gap-y-3', className)}>{children}</div>
}

/** Primary action row (Format, Encrypt …). */
export function ToolActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
}

/** Output panel with Copy / Download / Clear and a subtle update animation. */
export function ToolOutput({ label = 'Output', value, error, errorTitle, onClear, filename = 'result.txt', mime = 'text/plain', language = 'text', emptyTitle = 'Output will appear here.', height = 'h-56', extraActions, shortcuts = true, errorAction, errorHints, wrapLong = false, children }: {
  label?: string; value: string; error?: string | null; errorTitle?: string; onClear?: () => void; filename?: string; mime?: string
  language?: 'json' | 'text'; emptyTitle?: string; height?: string; extraActions?: ReactNode; shortcuts?: boolean; errorAction?: ReactNode; errorHints?: string[]; wrapLong?: boolean; children?: ReactNode
}) {
  useShortcut({ key: 'c', mod: true, shift: true }, () => { if (value) navigator.clipboard?.writeText(value) }, shortcuts && !!value)
  return (
    <ToolSection title={label} actions={<>{extraActions}<CopyButton value={value} shortcut={shortcuts} /><DownloadButton value={value} filename={filename} mime={mime} />{onClear && <ClearButton onClick={onClear} shortcut={false} />}</>}>
      <div aria-live="polite">
        {error ? (
          <ErrorMessage title={errorTitle ?? 'Something went wrong'} hints={errorHints} action={errorAction}>{error}</ErrorMessage>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={value ? 'has' : 'empty'} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {value ? (
                children ?? (language === 'json' ? <CodeView value={value} language="json" label={label} height={height} /> : (
                  <pre tabIndex={0} aria-label={label} className={cn('max-h-96 min-h-[3.5rem] overflow-auto rounded-md border border-input bg-background/60 px-3 py-2.5 font-mono text-[13px] leading-5', wrapLong ? 'whitespace-pre-wrap break-all' : 'whitespace-pre-wrap break-words')}>{value}</pre>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border"><EmptyState title={emptyTitle} className="py-7" /></div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </ToolSection>
  )
}
