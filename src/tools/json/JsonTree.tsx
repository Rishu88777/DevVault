import { createContext, memo, useContext, useEffect, useMemo, useState } from 'react'
import { ChevronRight, Copy, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/common/SearchInput'
import { ClearButton } from '@/components/common/ActionButtons'
import { CodeEditor } from '@/components/common/CodeEditor'
import { copyText } from '@/components/common/CopyButton'
import { EmptyState, ErrorMessage } from '@/components/common/Feedback'
import { ToolSection } from '@/components/tool/parts'
import { parseJson } from '@/lib/formatting/json'
import { cn } from '@/lib/utils'

const typeOf = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)
const childPath = (p: string, k: string | number) => (typeof k === 'number' ? `${p}[${k}]` : /^[A-Za-z_$][\w$]*$/.test(k) ? `${p}.${k}` : `${p}["${k}"]`)
const entries = (v: unknown): [string | number, unknown][] => (Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v as object))
const isContainer = (v: unknown) => typeof v === 'object' && v !== null

/** Paths whose key or primitive value matches, plus all their ancestors (so they can be auto-expanded). */
function searchPaths(root: unknown, q: string) {
  const matches = new Set<string>(), ancestors = new Set<string>()
  if (!q) return { matches, ancestors }
  const needle = q.toLowerCase()
  const walk = (v: unknown, path: string, key: string): boolean => {
    let hit = key.toLowerCase().includes(needle) || (!isContainer(v) && String(v).toLowerCase().includes(needle))
    if (isContainer(v)) for (const [k, c] of entries(v)) if (walk(c, childPath(path, k), String(k))) { hit = true; ancestors.add(path) }
    if (hit) matches.add(path)
    return hit
  }
  walk(root, '$', '')
  return { matches, ancestors }
}

interface Ctx { matches: Set<string>; ancestors: Set<string>; query: string; epoch: number; mode: 'all' | 'none' | null }
const TreeCtx = createContext<Ctx>({ matches: new Set(), ancestors: new Set(), query: '', epoch: 0, mode: null })
const PAGE = 200

const Node = memo(function Node({ name, value, path, depth }: { name: string | number | null; value: unknown; path: string; depth: number }) {
  const { matches, ancestors, query, epoch, mode } = useContext(TreeCtx)
  const container = isContainer(value)
  const [manual, setManual] = useState<boolean | null>(null)
  const [shown, setShown] = useState(PAGE)
  useEffect(() => { if (mode) setManual(mode === 'all') }, [epoch, mode])
  const open = container && (manual ?? (ancestors.has(path) || depth < 1))
  const t = typeOf(value)
  const kids = container ? entries(value) : []
  const hit = query !== '' && matches.has(path) && (!container || String(name).toLowerCase().includes(query.toLowerCase()))

  return (
    <li role="treeitem" aria-expanded={container ? open : undefined}>
      <div className={cn('group flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted/60', hit && 'bg-warning/15')}>
        {container ? (
          <button type="button" onClick={() => setManual(!open)} aria-label={`${open ? 'Collapse' : 'Expand'} ${name ?? 'root'}`} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} />
          </button>
        ) : <span className="w-5" />}
        {name !== null && <span className={cn('font-mono text-[13px]', typeof name === 'number' ? 'text-muted-foreground' : 'tok-key')}>{name}</span>}
        {name !== null && <span className="text-muted-foreground">:</span>}
        {container ? (
          <span className="text-xs text-muted-foreground">{Array.isArray(value) ? `Array(${kids.length})` : `Object{${kids.length}}`}</span>
        ) : (
          <span className={cn('truncate font-mono text-[13px]', t === 'string' ? 'tok-string' : `tok-${t === 'boolean' ? 'bool' : t}`)}>{t === 'string' ? JSON.stringify(value) : String(value)}</span>
        )}
        <span className="rounded bg-muted px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{t}</span>
        <span className="ml-auto flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button size="icon-sm" variant="ghost" aria-label={`Copy path ${path}`} title="Copy path" className="size-6" onClick={() => copyText(path)}><Link2 className="!size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" aria-label="Copy value" title="Copy value" className="size-6" onClick={() => copyText(container ? JSON.stringify(value, null, 2) : typeof value === 'string' ? value : String(value))}><Copy className="!size-3.5" /></Button>
        </span>
      </div>
      {open && (
        <ul role="group" className="ml-[11px] border-l border-border pl-3">
          {kids.slice(0, shown).map(([k, v]) => <Node key={k} name={k} value={v} path={childPath(path, k)} depth={depth + 1} />)}
          {kids.length > shown && <li><Button size="sm" variant="ghost" onClick={() => setShown((s) => s + PAGE)}>Show {Math.min(PAGE, kids.length - shown)} more of {kids.length - shown}</Button></li>}
        </ul>
      )}
    </li>
  )
})

export function JsonTree() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [ctl, setCtl] = useState<{ epoch: number; mode: 'all' | 'none' | null }>({ epoch: 0, mode: null })
  const parsed = useMemo(() => (input.trim() ? parseJson(input) : null), [input])
  const root = parsed?.ok ? parsed.value : undefined
  const { matches, ancestors } = useMemo(() => (parsed?.ok ? searchPaths(root, query.trim()) : { matches: new Set<string>(), ancestors: new Set<string>() }), [parsed, root, query])
  const ctx = useMemo<Ctx>(() => ({ matches, ancestors, query: query.trim(), ...ctl }), [matches, ancestors, query, ctl])

  return (
    <>
      <ToolSection title="Input" actions={input ? <ClearButton onClick={() => { setInput(''); setQuery('') }} /> : null}>
        <CodeEditor label="JSON input" value={input} onChange={setInput} height="h-56" errorLine={parsed && !parsed.ok ? parsed.error.line : undefined} emptyHint="Paste JSON to explore it as a tree." />
      </ToolSection>
      {parsed && !parsed.ok && <ErrorMessage title="Invalid JSON">{parsed.error.message} at line {parsed.error.line}, column {parsed.error.column}.</ErrorMessage>}
      <ToolSection title="Tree" actions={parsed?.ok && <>
        <Button size="sm" variant="ghost" onClick={() => setCtl((c) => ({ epoch: c.epoch + 1, mode: 'all' }))}>Expand all</Button>
        <Button size="sm" variant="ghost" onClick={() => setCtl((c) => ({ epoch: c.epoch + 1, mode: 'none' }))}>Collapse all</Button>
      </>}>
        {parsed?.ok ? (
          <div className="space-y-3">
            <SearchInput aria-label="Search keys and values" placeholder="Search keys and values…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="max-h-[32rem] overflow-auto rounded-md border border-input bg-background/60 p-2">
              <TreeCtx.Provider value={ctx}><ul role="tree" aria-label="JSON tree"><Node name={null} value={root} path="$" depth={0} /></ul></TreeCtx.Provider>
              {query.trim() && matches.size === 0 && <p className="p-3 text-sm text-muted-foreground">No matches for “{query}”.</p>}
            </div>
          </div>
        ) : <div className="rounded-md border border-dashed border-border"><EmptyState title="The tree will appear here." hint="Paste valid JSON above." /></div>}
      </ToolSection>
    </>
  )
}
