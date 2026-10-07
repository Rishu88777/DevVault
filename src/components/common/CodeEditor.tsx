import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { tokenizeJson } from '@/lib/formatting/json'
import { Button } from '@/components/ui/button'
import { readClipboard } from '@/components/common/Feedback'
import { INPUT_RENDER_LIMIT, LargeInputNotice, interceptLargePaste } from '@/components/common/LargeInput'
import { cn } from '@/lib/utils'

const LINE_H = 22 // px, must match leading-[22px]
const PAD = 10

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

/** Editable code area with line numbers and an error-line highlight. Scroll sync is done without React state so huge inputs stay smooth. */
export const CodeEditor = forwardRef<CodeEditorHandle, EditorProps>(({ value, onChange, placeholder, errorLine, height = 'h-80', label, className, onKeyDown, emptyHint }, ref) => {
  const ta = useRef<HTMLTextAreaElement>(null)
  const gutter = useRef<HTMLPreElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => { let n = 1; for (let i = value.indexOf('\n'); i !== -1; i = value.indexOf('\n', i + 1)) n++; return n }, [value])
  const numbers = useMemo(() => { const out = new Array<number>(lines); for (let i = 0; i < lines; i++) out[i] = i + 1; return out.join('\n') }, [lines])

  const sync = () => {
    const top = ta.current?.scrollTop ?? 0
    if (gutter.current) gutter.current.style.transform = `translateY(${-top}px)`
    if (bar.current && errorLine) bar.current.style.top = `${PAD + (errorLine - 1) * LINE_H - top}px`
  }
  useLayoutEffect(sync) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className={cn('relative flex overflow-hidden rounded-md border-2 border-input bg-muted/40 font-mono text-[14px] transition-colors focus-within:border-ring focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/30', errorLine && 'border-danger/60', height, className)}>
      <div aria-hidden className="shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pl-2 pr-2 text-right text-muted-foreground/60" style={{ paddingTop: PAD, minWidth: '3rem' }}>
        <pre ref={gutter} className="font-mono text-[14px] leading-[22px] will-change-transform">{numbers}</pre>
      </div>
      <div className="relative min-w-0 flex-1">
        {errorLine ? <div ref={bar} aria-hidden className="pointer-events-none absolute inset-x-0 bg-danger/15" style={{ top: PAD + (errorLine - 1) * LINE_H, height: LINE_H }} /> : null}
        {value.length > INPUT_RENDER_LIMIT ? (
          <div className="absolute inset-0 p-2"><LargeInputNotice chars={value.length} onClear={() => onChange('')} /></div>
        ) : (
          <textarea ref={ta} aria-label={label} value={value} placeholder={emptyHint ?? placeholder} wrap="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
            onChange={(e) => onChange(e.target.value)} onPaste={(e) => interceptLargePaste(e, onChange)} onKeyDown={onKeyDown} onScroll={sync}
            className="absolute inset-0 size-full resize-none bg-transparent px-3 leading-[22px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0" style={{ paddingTop: PAD, paddingBottom: PAD, tabSize: 2 }} />
        )}
        {!value && (
          <Button size="sm" variant="ghost" className="absolute right-2 top-2 z-10" onClick={async () => { const t = await readClipboard(); if (t !== null) onChange(t) }}><ClipboardPaste /> Paste</Button>
        )}
      </div>
    </div>
  )
})
CodeEditor.displayName = 'CodeEditor'

const HIGHLIGHT_LIMIT = 300_000
const WRAP_LIMIT = 4_000 // lines; beyond this a single non-wrapping block is used for speed

type Seg = { kind: string; text: string }
function splitLines(tokens: { kind: string; text: string }[]): Seg[][] {
  const lines: Seg[][] = [[]]
  for (const t of tokens) {
    if (t.kind !== 'plain' || !t.text.includes('\n')) { lines[lines.length - 1].push(t); continue }
    const parts = t.text.split('\n')
    parts.forEach((p, i) => { if (i > 0) lines.push([]); if (p) lines[lines.length - 1].push({ kind: 'plain', text: p }) })
  }
  return lines
}

/** Read-only code viewer: line numbers, JSON highlighting, long lines wrap (no sideways scrolling). */
export function CodeView({ value, language = 'text', height = 'h-80', label, className }: { value: string; language?: 'json' | 'text'; height?: string; label: string; className?: string }) {
  const rows = useMemo(() => {
    const tokens = language === 'json' && value.length < HIGHLIGHT_LIMIT ? tokenizeJson(value) : [{ kind: 'plain', text: value }]
    const l = splitLines(tokens)
    return l.length <= WRAP_LIMIT ? l : null
  }, [value, language])
  const box = cn('overflow-auto rounded-md border-2 border-input bg-background font-mono text-[14px] leading-[22px]', height, className)
  if (!rows) {
    const n = value.split('\n').length
    return (
      <div className={cn(box, 'flex')} role="region" aria-label={label} tabIndex={0}>
        <pre aria-hidden className="sticky left-0 shrink-0 select-none border-r border-border bg-card px-2 py-2 text-right text-muted-foreground/60">{Array.from({ length: n }, (_, i) => i + 1).join('\n')}</pre>
        <pre className="px-3 py-2">{value}</pre>
      </div>
    )
  }
  return (
    <div className={box} role="region" aria-label={label} tabIndex={0}>
      <div className="py-2">
        {rows.map((segs, i) => (
          <div key={i} className="flex">
            <span aria-hidden className="w-12 shrink-0 select-none pr-3 text-right text-muted-foreground/60">{i + 1}</span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-all pr-3">{segs.map((t, j) => (t.kind === 'plain' ? t.text : <span key={j} className={`tok-${t.kind}`}>{t.text}</span>))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
