import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { tokenizeJson } from '@/lib/formatting/json'
import { Button } from '@/components/ui/button'
import { readClipboard } from '@/components/common/Feedback'
import { cn } from '@/lib/utils'

const LINE_H = 20 // px, must match leading-5
const PAD = 8

export interface CodeEditorHandle { jumpTo: (position: number) => void; focus: () => void }

interface EditorProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  errorLine?: number
  height?: string
  label: string
  className?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>
  /** Shown (with a paste button) while the editor is empty. */
  emptyHint?: string
}

/** Editable code area with line numbers and an error-line highlight. */
export const CodeEditor = forwardRef<CodeEditorHandle, EditorProps>(({ value, onChange, placeholder, errorLine, height = 'h-80', label, className, onKeyDown, emptyHint }, ref) => {
  const ta = useRef<HTMLTextAreaElement>(null)
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const lines = useMemo(() => value.split('\n').length, [value])

  useImperativeHandle(ref, () => ({
    focus: () => ta.current?.focus(),
    jumpTo: (pos) => {
      const el = ta.current
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, Math.min(pos + 1, value.length))
      const line = value.slice(0, pos).split('\n').length
      el.scrollTop = Math.max(0, (line - 4) * LINE_H)
    },
  }), [value])

  return (
    <div className={cn('relative flex overflow-hidden rounded-md border border-input bg-background/60 font-mono text-[13px] transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring', errorLine && 'border-danger/60', height, className)}>
      <div aria-hidden className="shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 py-2 pl-2 pr-2 text-right leading-5 text-muted-foreground/60" style={{ paddingTop: PAD }}>
        <div style={{ transform: `translateY(${-scroll.top}px)` }}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className={cn(errorLine === i + 1 && 'font-semibold text-danger')}>{i + 1}</div>
          ))}
        </div>
      </div>
      <div className="relative min-w-0 flex-1">
        {errorLine ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bg-danger/15" style={{ top: PAD + (errorLine - 1) * LINE_H - scroll.top, height: LINE_H }} /> : null}
        <textarea ref={ta} aria-label={label} value={value} placeholder={placeholder} wrap="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
          onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown}
          onScroll={(e) => setScroll({ top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft })}
          className="absolute inset-0 size-full resize-none bg-transparent px-3 leading-5 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60" style={{ paddingTop: PAD, paddingBottom: PAD, tabSize: 2 }} />
        {!value && emptyHint && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm text-muted-foreground">{emptyHint}</p>
            <Button size="sm" className="pointer-events-auto" onClick={async () => { const t = await readClipboard(); if (t !== null) onChange(t) }}><ClipboardPaste /> Paste from Clipboard</Button>
          </div>
        )}
      </div>
    </div>
  )
})
CodeEditor.displayName = 'CodeEditor'

const HIGHLIGHT_LIMIT = 300_000

/** Read-only code viewer with line numbers and optional JSON syntax highlighting. */
export function CodeView({ value, language = 'text', height = 'h-80', label, className }: { value: string; language?: 'json' | 'text'; height?: string; label: string; className?: string }) {
  const lines = useMemo(() => value.split('\n').length, [value])
  const tokens = useMemo(() => (language === 'json' && value.length < HIGHLIGHT_LIMIT ? tokenizeJson(value) : null), [value, language])
  return (
    <div className={cn('flex overflow-auto rounded-md border border-input bg-background/60 font-mono text-[13px] leading-5', height, className)} role="region" aria-label={label} tabIndex={0}>
      <pre aria-hidden className="sticky left-0 shrink-0 select-none border-r border-border bg-card/95 py-2 pl-2 pr-2 text-right text-muted-foreground/60">{Array.from({ length: lines }, (_, i) => i + 1).join('\n')}</pre>
      <pre className="min-w-0 flex-1 px-3 py-2">
        {tokens ? tokens.map((t, i) => (t.kind === 'plain' ? t.text : <span key={i} className={`tok-${t.kind}`}>{t.text}</span>)) : value}
      </pre>
    </div>
  )
}
