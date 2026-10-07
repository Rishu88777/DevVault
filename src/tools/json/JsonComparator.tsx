import { useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input } from '@/components/ui/fields'
import { Tooltip } from '@/components/ui/tooltip'
import { CodeEditor, type CodeEditorHandle } from '@/components/common/CodeEditor'
import { ClearButton } from '@/components/common/ActionButtons'
import { CopyButton } from '@/components/common/CopyButton'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolActions, ToolSection } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { diffJson } from '@/lib/comparison/jsonDiff'
import { buildSideBySide, type Cell } from '@/lib/comparison/sideBySide'
import { parseJson } from '@/lib/formatting/json'
import { cn } from '@/lib/utils'

const EXAMPLE_A = '{\n  "name": "John",\n  "age": 30,\n  "tags": ["a", "b"],\n  "address": { "city": "Paris", "zip": "75001" }\n}'
const EXAMPLE_B = '{\n  "name": "Rishu",\n  "tags": ["a", "c", "d"],\n  "address": { "city": "Paris", "country": "FR" },\n  "age": 30\n}'

const CELL: Record<Cell['kind'], string> = {
  same: '', empty: 'bg-muted/40', added: 'bg-success/15 text-success', removed: 'bg-danger/15 text-danger', changed: 'bg-warning/15 text-warning',
}
const MARK: Record<Cell['kind'], string> = { same: ' ', empty: ' ', added: '+', removed: '−', changed: '~' }

type Result = { rows: ReturnType<typeof buildSideBySide>['rows']; changes: number; report: string } | { error: string; side: 'A' | 'B'; line: number }

export function JsonComparator() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [opts, setOpts] = useState({ ignoreKeyOrder: true, ignoreArrayOrder: false, ignoreStringWhitespace: false })
  const [ignored, setIgnored] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const edA = useRef<CodeEditorHandle>(null)
  const edB = useRef<CodeEditorHandle>(null)

  const run = () => {
    if (!a.trim() || !b.trim()) return
    const pa = parseJson(a), pb = parseJson(b)
    if (!pa.ok) return setResult({ side: 'A', error: `${pa.error.message} at line ${pa.error.line}, column ${pa.error.column}.`, line: pa.error.line })
    if (!pb.ok) return setResult({ side: 'B', error: `${pb.error.message} at line ${pb.error.line}, column ${pb.error.column}.`, line: pb.error.line })
    const options = { ...opts, ignoredFields: ignored.split(',') }
    const sbs = buildSideBySide(pa.value, pb.value, options)
    const report = diffJson(pa.value, pb.value, options).map((d) => `${d.type.toUpperCase()} ${d.path}${'left' in d ? `\n  - ${JSON.stringify(d.left)}` : ''}${'right' in d ? `\n  + ${JSON.stringify(d.right)}` : ''}`).join('\n')
    setResult({ ...sbs, report })
  }
  const clear = () => { setA(''); setB(''); setResult(null) }
  useToolShortcuts({ run, clear })
  const err = result && 'error' in result ? result : null
  const ok = result && 'rows' in result ? result : null
  const stats = useMemo(() => {
    if (!ok) return null
    let added = 0, removed = 0, changed = 0
    for (const r of ok.rows) { if (r.right.kind === 'added') added++; if (r.left.kind === 'removed') removed++; if (r.left.kind === 'changed') changed++ }
    return { added, removed, changed }
  }, [ok])

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSection title="JSON A (original)">
          <CodeEditor ref={edA} label="JSON A" value={a} onChange={(v) => { setA(v); setResult(null) }} height="h-72" errorLine={err?.side === 'A' ? err.line : undefined} emptyHint="Paste the first JSON document." />
        </ToolSection>
        <ToolSection title="JSON B (changed)">
          <CodeEditor ref={edB} label="JSON B" value={b} onChange={(v) => { setB(v); setResult(null) }} height="h-72" errorLine={err?.side === 'B' ? err.line : undefined} emptyHint="Paste the second JSON document." />
        </ToolSection>
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Checkbox label="Ignore array order" checked={opts.ignoreArrayOrder} onChange={(v) => setOpts((o) => ({ ...o, ignoreArrayOrder: v }))} />
        <Checkbox label="Ignore whitespace in strings" checked={opts.ignoreStringWhitespace} onChange={(v) => setOpts((o) => ({ ...o, ignoreStringWhitespace: v }))} />
        <Field label="Ignore fields (comma-separated)" className="min-w-56 flex-1"><Input value={ignored} onChange={(e) => setIgnored(e.target.value)} placeholder="id, updatedAt, user.token" aria-label="Fields to ignore" /></Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Key order never counts as a difference; both sides are shown in the key order of JSON A.</p>

      <ToolActions>
        <Tooltip label="Compare" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={run} disabled={!a.trim() || !b.trim()}><GitCompare /> Compare</Button></Tooltip>
        <Button onClick={() => { const t = a; setA(b); setB(t); setResult(null) }} disabled={!a && !b}><ArrowLeftRight /> Swap</Button>
        <Button variant="ghost" onClick={() => { setA(EXAMPLE_A); setB(EXAMPLE_B); setResult(null) }}>Load example</Button>
        <ClearButton onClick={clear} disabled={!a && !b} />
      </ToolActions>

      {err && <ErrorMessage title={`Invalid JSON in ${err.side}`} action={<Button size="sm" onClick={() => (err.side === 'A' ? edA : edB).current?.focus()}>Go to editor</Button>}>{err.error}</ErrorMessage>}

      <ToolSection title="Differences" actions={ok && ok.changes > 0 ? <CopyButton value={ok.report} label="Copy report" /> : null}>
        {!ok ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Paste two JSON documents and press Compare. Differences appear side by side.</p>
        ) : ok.changes === 0 ? (
          <p role="status" className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success">No differences — the documents are equivalent with the selected options.</p>
        ) : (
          <div className="space-y-2" aria-live="polite">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-muted px-2.5 py-1">{ok.changes} difference{ok.changes > 1 ? 's' : ''}</span>
              {stats!.changed > 0 && <span className="rounded-full bg-warning/15 px-2.5 py-1 text-warning">~ {stats!.changed} changed</span>}
              {stats!.removed > 0 && <span className="rounded-full bg-danger/15 px-2.5 py-1 text-danger">− {stats!.removed} removed lines</span>}
              {stats!.added > 0 && <span className="rounded-full bg-success/15 px-2.5 py-1 text-success">+ {stats!.added} added lines</span>}
            </div>
            <div className="max-h-[36rem] overflow-auto rounded-md border border-input bg-background/60 font-mono text-[13px] leading-5" role="region" aria-label="Side-by-side differences" tabIndex={0}>
              <table className="w-full min-w-[40rem] table-fixed border-collapse"><colgroup><col className="w-8" /><col /><col className="w-8" /><col /></colgroup>
                <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground"><tr><th colSpan={2} className="border-b border-r border-border px-3 py-1.5 text-left font-medium">JSON A</th><th colSpan={2} className="border-b border-border px-3 py-1.5 text-left font-medium">JSON B</th></tr></thead>
                <tbody>
                  {ok.rows.map((r, i) => (
                    <tr key={i}>
                      <td className={cn('w-8 select-none border-r border-border/50 px-1.5 text-right text-muted-foreground/60', CELL[r.left.kind])}>{MARK[r.left.kind]}</td>
                      <td className={cn('whitespace-pre-wrap break-all border-r border-border px-2', CELL[r.left.kind])}>{r.left.text}</td>
                      <td className={cn('w-8 select-none border-r border-border/50 px-1.5 text-right text-muted-foreground/60', CELL[r.right.kind])}>{MARK[r.right.kind]}</td>
                      <td className={cn('whitespace-pre-wrap break-all px-2', CELL[r.right.kind])}>{r.right.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ToolSection>
    </>
  )
}
