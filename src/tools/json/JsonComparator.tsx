import { useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input } from '@/components/ui/fields'
import { CodeEditor, type CodeEditorHandle } from '@/components/common/CodeEditor'
import { ClearButton } from '@/components/common/ActionButtons'
import { CopyButton } from '@/components/common/CopyButton'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolSection } from '@/components/tool/parts'
import { useLiveResult } from '@/hooks/useLiveResult'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { buildSideBySide, type Cell, type Change, type Row } from '@/lib/comparison/sideBySide'
import { parseJson } from '@/lib/formatting/json'
import { cn } from '@/lib/utils'

const EXAMPLE_A = '{\n  "name": "John",\n  "age": 30,\n  "tags": ["a", "b"],\n  "address": { "city": "Paris", "zip": "75001" }\n}'
const EXAMPLE_B = '{\n  "name": "Rishu",\n  "tags": ["a", "c", "d"],\n  "address": { "city": "Paris", "country": "FR" },\n  "age": 30\n}'

const CELL: Record<Cell['kind'], string> = {
  same: '', empty: 'bg-muted/50', added: 'bg-success/20 text-success', removed: 'bg-danger/20 text-danger', changed: 'bg-warning/20 text-warning',
}
const MARK: Record<Cell['kind'], string> = { same: ' ', empty: ' ', added: '+', removed: '−', changed: '~' }
const BADGE: Record<Change['type'], string> = { added: 'bg-success/15 text-success border-success/30', removed: 'bg-danger/15 text-danger border-danger/30', changed: 'bg-warning/15 text-warning border-warning/30' }

type Computed = { ok: true; rows: Row[]; changes: Change[] } | { ok: false; side: 'A' | 'B'; message: string; line: number }

/** Compares automatically as you type or paste — no button. */
export function JsonComparator() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState(false)
  const [ignoreStringWhitespace, setIgnoreStringWhitespace] = useState(false)
  const [ignored, setIgnored] = useState('')
  const [current, setCurrent] = useState(0)
  const edA = useRef<CodeEditorHandle>(null)
  const edB = useRef<CodeEditorHandle>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const clear = () => { setA(''); setB(''); setCurrent(0) }
  useToolShortcuts({ clear })
  const ready = a.trim() !== '' && b.trim() !== ''

  const { value: res } = useLiveResult<Computed>(() => {
    const pa = parseJson(a), pb = parseJson(b)
    if (!pa.ok) return { ok: false, side: 'A', message: pa.error.message, line: pa.error.line }
    if (!pb.ok) return { ok: false, side: 'B', message: pb.error.message, line: pb.error.line }
    const { rows } = buildSideBySide(pa.value, pb.value, { ignoreArrayOrder, ignoreStringWhitespace, ignoredFields: ignored.split(',') })
    return { ok: true, rows, changes: rows.flatMap((r) => (r.change ? [r.change] : [])) }
  }, [a, b, ignoreArrayOrder, ignoreStringWhitespace, ignored], { enabled: ready, delay: 200 })
  const view = ready ? res : undefined
  const err = view && !view.ok ? view : null
  const ok = view && view.ok ? view : null

  const rowIndexOf = useMemo(() => (ok ? ok.rows.flatMap((r, i) => (r.change ? [i] : [])) : []), [ok])
  const go = (n: number) => {
    if (!ok || ok.changes.length === 0) return
    const i = (n + ok.changes.length) % ok.changes.length
    setCurrent(i)
    scroller.current?.querySelector(`[data-row="${rowIndexOf[i]}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
  const report = ok ? ok.changes.map((c) => `${c.type.toUpperCase()} ${c.path || '$'}: ${c.message}`).join('\n') : ''

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSection title="JSON A (original)">
          <CodeEditor ref={edA} label="JSON A" value={a} onChange={(v) => { setA(v); setCurrent(0) }} height="h-[max(14rem,30dvh)]" errorLine={err?.side === 'A' ? err.line : undefined} emptyHint="Paste or type the first JSON document…" />
        </ToolSection>
        <ToolSection title="JSON B (changed)">
          <CodeEditor ref={edB} label="JSON B" value={b} onChange={(v) => { setB(v); setCurrent(0) }} height="h-[max(14rem,30dvh)]" errorLine={err?.side === 'B' ? err.line : undefined} emptyHint="Paste or type the second JSON document…" />
        </ToolSection>
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Checkbox label="Ignore array order" checked={ignoreArrayOrder} onChange={setIgnoreArrayOrder} />
        <Checkbox label="Ignore whitespace in strings" checked={ignoreStringWhitespace} onChange={setIgnoreStringWhitespace} />
        <Field label="Ignore fields (comma-separated)" className="min-w-56 flex-1"><Input value={ignored} onChange={(e) => setIgnored(e.target.value)} placeholder="id, updatedAt, user.token" aria-label="Fields to ignore" /></Field>
        <Button onClick={() => { const t = a; setA(b); setB(t) }} disabled={!a && !b}><ArrowLeftRight /> Swap</Button>
        <Button variant="ghost" onClick={() => { setA(EXAMPLE_A); setB(EXAMPLE_B) }}>Load example</Button>
        <ClearButton onClick={clear} disabled={!a && !b} />
      </div>

      {err && <ErrorMessage title={`Invalid JSON in ${err.side}`} action={<Button size="sm" onClick={() => (err.side === 'A' ? edA : edB).current?.focus()}>Go to editor</Button>}>{err.message} at line {err.line}.</ErrorMessage>}

      <ToolSection title={ok ? (ok.changes.length === 0 ? 'No differences' : `Found ${ok.changes.length} difference${ok.changes.length > 1 ? 's' : ''}`) : 'Differences'} actions={ok && ok.changes.length > 0 ? <CopyButton value={report} label="Copy report" /> : null}>
        {!ok ? (
          <p className="rounded-md border-2 border-dashed border-input px-4 py-10 text-center text-sm text-muted-foreground">Paste JSON into both boxes — differences appear here automatically, side by side.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]" aria-live="polite">
            <div ref={scroller} className="max-h-[calc(100dvh-9rem)] min-h-[16rem] overflow-auto rounded-md border-2 border-input bg-background font-mono text-[14px] leading-[22px]" role="region" aria-label="Side-by-side differences" tabIndex={0}>
              <table className="w-full min-w-[34rem] table-fixed border-collapse">
                <colgroup><col className="w-8" /><col /><col className="w-8" /><col /></colgroup>
                <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground"><tr><th colSpan={2} className="border-b border-r border-border px-3 py-1.5 text-left font-medium">JSON A</th><th colSpan={2} className="border-b border-border px-3 py-1.5 text-left font-medium">JSON B</th></tr></thead>
                <tbody>
                  {ok.rows.map((r, i) => (
                    <tr key={i} data-row={i} className={cn(r.change && ok.changes.indexOf(r.change) === current && 'outline outline-2 -outline-offset-2 outline-accent')}>
                      <td className={cn('select-none border-r border-border/50 px-1.5 text-right text-muted-foreground/60', CELL[r.left.kind])}>{MARK[r.left.kind]}</td>
                      <td className={cn('whitespace-pre-wrap break-all border-r border-border px-2', CELL[r.left.kind])}>{r.left.text}</td>
                      <td className={cn('select-none border-r border-border/50 px-1.5 text-right text-muted-foreground/60', CELL[r.right.kind])}>{MARK[r.right.kind]}</td>
                      <td className={cn('whitespace-pre-wrap break-all px-2', CELL[r.right.kind])}>{r.right.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside aria-label="Differences list" className="space-y-2">
              {ok.changes.length > 0 && (
                <div className="flex items-center justify-between rounded-md border border-border bg-card px-2 py-1 text-sm">
                  <Button size="icon-sm" variant="ghost" aria-label="Previous difference" onClick={() => go(current - 1)}><ChevronLeft /></Button>
                  <span className="font-medium">{current + 1} of {ok.changes.length}</span>
                  <Button size="icon-sm" variant="ghost" aria-label="Next difference" onClick={() => go(current + 1)}><ChevronRight /></Button>
                </div>
              )}
              <ul className="max-h-[calc(100dvh-13rem)] space-y-2 overflow-auto">
                {ok.changes.map((c, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => go(i)} className={cn('w-full rounded-md border bg-card p-2.5 text-left text-[13px] leading-snug transition-colors hover:bg-muted', i === current ? 'border-accent' : 'border-border')}>
                      <span className={cn('mb-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase', BADGE[c.type])}>{c.type}</span>
                      <span className="block break-words">{c.message}</span>
                      <code className="mt-1 block break-all text-[11px] text-muted-foreground">{c.path || '$'}</code>
                    </button>
                  </li>
                ))}
                {ok.changes.length === 0 && <li className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">Both documents are equivalent with the selected options.</li>}
              </ul>
            </aside>
          </div>
        )}
      </ToolSection>
    </>
  )
}
