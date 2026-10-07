import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeftRight, ArrowRight, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Input, Field } from '@/components/ui/fields'
import { Tooltip } from '@/components/ui/tooltip'
import { CodeEditor, type CodeEditorHandle } from '@/components/common/CodeEditor'
import { ClearButton } from '@/components/common/ActionButtons'
import { CopyButton } from '@/components/common/CopyButton'
import { EmptyState, ErrorMessage } from '@/components/common/Feedback'
import { ToolActions, ToolSection, ToolSettings } from '@/components/tool/parts'
import { useJsonWorker } from '@/hooks/useJsonWorker'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { summarizeDiff, type DiffEntry, type DiffType } from '@/lib/comparison/jsonDiff'
import { cn, errorMessage } from '@/lib/utils'

const fmt = (v: unknown) => {
  const s = JSON.stringify(v, null, 1) ?? 'undefined'
  return s.length > 400 ? s.slice(0, 400) + '…' : s
}
const STYLE: Record<DiffType, { label: string; badge: string; sign: string }> = {
  added: { label: 'Added', badge: 'bg-success/15 text-success', sign: '+' },
  removed: { label: 'Removed', badge: 'bg-danger/15 text-danger', sign: '−' },
  changed: { label: 'Changed', badge: 'bg-warning/15 text-warning', sign: '~' },
  reordered: { label: 'Key order', badge: 'bg-muted text-muted-foreground', sign: '⇅' },
}

function DiffRow({ d, index }: { d: DiffEntry; index: number }) {
  const st = STYLE[d.type]
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: Math.min(index, 12) * 0.015 }} className="rounded-lg border border-border bg-card/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', st.badge)}>{st.sign} {st.label}</span>
        <code className="break-all font-mono text-sm font-medium">{d.path}</code>
      </div>
      <div className="mt-2 grid gap-1.5 font-mono text-[13px]">
        {d.type === 'reordered' ? (
          <p className="text-muted-foreground">Keys are in a different order: <span className="text-foreground">{(d.left as string[]).join(', ')}</span> <ArrowRight className="mx-1 inline size-3" /> <span className="text-foreground">{(d.right as string[]).join(', ')}</span></p>
        ) : (
          <>
            {'left' in d && <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-danger/10 px-2 py-1 text-danger"><span className="select-none opacity-60">− </span>{fmt(d.left)}</pre>}
            {'right' in d && <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-success/10 px-2 py-1 text-success"><span className="select-none opacity-60">+ </span>{fmt(d.right)}</pre>}
          </>
        )}
      </div>
    </motion.li>
  )
}

const EXAMPLE_A = '{\n  "name": "John",\n  "age": 30,\n  "tags": ["a", "b"],\n  "address": { "city": "Paris", "zip": "75001" }\n}'
const EXAMPLE_B = '{\n  "name": "Rishu",\n  "tags": ["a", "c", "d"],\n  "address": { "city": "Paris", "country": "FR" },\n  "age": 30\n}'

export function JsonComparator() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [opts, setOpts] = useState({ ignoreKeyOrder: true, ignoreArrayOrder: false, ignoreStringWhitespace: false })
  const [ignored, setIgnored] = useState('')
  const [diff, setDiff] = useState<DiffEntry[] | null>(null)
  const [err, setErr] = useState<{ side: 'A' | 'B'; message: string; line: number; column: number } | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const edA = useRef<CodeEditorHandle>(null)
  const edB = useRef<CodeEditorHandle>(null)
  const { compare } = useJsonWorker()

  const run = async () => {
    if (!a.trim() || !b.trim()) return
    setBusy(true); setFatal(null)
    try {
      const r = await compare(a, b, { ...opts, ignoredFields: ignored.split(',') })
      if (r.ok) { setDiff(r.diff); setErr(null) } else { setErr(r); setDiff(null) }
    } catch (e) { setFatal(errorMessage(e)) } finally { setBusy(false) }
  }
  const clear = () => { setA(''); setB(''); setDiff(null); setErr(null); setFatal(null) }
  useToolShortcuts({ run, clear })
  const summary = useMemo(() => (diff ? summarizeDiff(diff) : null), [diff])
  const report = useMemo(() => (diff ?? []).map((d) => `${d.type.toUpperCase()} ${d.path}${'left' in d ? `\n  - ${JSON.stringify(d.left)}` : ''}${'right' in d ? `\n  + ${JSON.stringify(d.right)}` : ''}`).join('\n'), [diff])

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSection title="JSON A">
          <CodeEditor ref={edA} label="JSON A" value={a} onChange={(v) => { setA(v); setDiff(null) }} height="h-72" errorLine={err?.side === 'A' ? err.line : undefined} emptyHint="Paste the first JSON document." />
        </ToolSection>
        <ToolSection title="JSON B">
          <CodeEditor ref={edB} label="JSON B" value={b} onChange={(v) => { setB(v); setDiff(null) }} height="h-72" errorLine={err?.side === 'B' ? err.line : undefined} emptyHint="Paste the second JSON document." />
        </ToolSection>
      </div>
      <ToolSettings>
        <Checkbox label="Ignore key order" checked={opts.ignoreKeyOrder} onChange={(v) => setOpts((o) => ({ ...o, ignoreKeyOrder: v }))} />
        <Checkbox label="Ignore array order" checked={opts.ignoreArrayOrder} onChange={(v) => setOpts((o) => ({ ...o, ignoreArrayOrder: v }))} />
        <Checkbox label="Ignore whitespace in strings" checked={opts.ignoreStringWhitespace} onChange={(v) => setOpts((o) => ({ ...o, ignoreStringWhitespace: v }))} />
        <Field label="Ignore fields" hint="comma-separated names or paths" className="min-w-56 flex-1"><Input value={ignored} onChange={(e) => setIgnored(e.target.value)} placeholder="id, updatedAt, user.token" aria-label="Fields to ignore" /></Field>
      </ToolSettings>
      <ToolActions>
        <Tooltip label="Compare" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={run} disabled={!a.trim() || !b.trim() || busy}><GitCompare /> Compare</Button></Tooltip>
        <Button onClick={() => { const t = a; setA(b); setB(t); setDiff(null) }} disabled={!a && !b}><ArrowLeftRight /> Swap</Button>
        <Button variant="ghost" onClick={() => { setA(EXAMPLE_A); setB(EXAMPLE_B); setDiff(null); setErr(null) }}>Load example</Button>
        <ClearButton onClick={clear} disabled={!a && !b} />
        {busy && <span className="text-sm text-muted-foreground">Comparing…</span>}
      </ToolActions>

      {err && (
        <ErrorMessage title={`Invalid JSON in ${err.side}`} action={<Button size="sm" onClick={() => (err.side === 'A' ? edA : edB).current?.jumpTo(0)}>Go to editor</Button>}>
          {err.message} at line {err.line}, column {err.column}.
        </ErrorMessage>
      )}
      {fatal && <ErrorMessage title="Unable to compare">{fatal}</ErrorMessage>}

      <ToolSection title="Differences" actions={diff && diff.length > 0 ? <CopyButton value={report} label="Copy report" /> : null}>
        {diff === null ? (
          <div className="rounded-md border border-dashed border-border"><EmptyState title="Paste two JSON documents to compare them." hint="Differences are listed by path, with added, removed and changed values." /></div>
        ) : diff.length === 0 ? (
          <div role="status" className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success">No differences — the documents are equivalent with the selected options.</div>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <div className="flex flex-wrap gap-2 text-xs">
              {(['added', 'removed', 'changed', 'reordered'] as const).filter((k) => summary![k] > 0).map((k) => <span key={k} className={cn('rounded-full px-2.5 py-1 font-medium', STYLE[k].badge)}>{summary![k]} {STYLE[k].label.toLowerCase()}</span>)}
            </div>
            <ul className="space-y-2">{diff.slice(0, 500).map((d, i) => <DiffRow key={`${d.type}-${d.path}-${i}`} d={d} index={i} />)}</ul>
            {diff.length > 500 && <p className="text-sm text-muted-foreground">Showing the first 500 of {diff.length} differences.</p>}
          </div>
        )}
      </ToolSection>
    </>
  )
}
