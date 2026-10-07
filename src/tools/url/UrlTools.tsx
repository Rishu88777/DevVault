import { useMemo, useState } from 'react'
import { ClearButton } from '@/components/common/ActionButtons'
import { CopyButton } from '@/components/common/CopyButton'
import { EmptyState, ErrorMessage } from '@/components/common/Feedback'
import { ToolInput, ToolSection } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { parseQuery, parseUrl } from '@/lib/url'
import { errorMessage } from '@/lib/utils'

function QueryTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No query parameters.</p>
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th scope="col" className="px-3 py-2 font-medium">Key</th><th scope="col" className="px-3 py-2 font-medium">Value</th></tr></thead>
        <tbody className="divide-y divide-border font-mono text-[13px]">
          {rows.map(([k, v], i) => <tr key={i}><td className="break-all px-3 py-2 align-top text-accent">{k}</td><td className="break-all px-3 py-2">{v || <span className="text-muted-foreground">(empty)</span>}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}

export function UrlParser() {
  const [input, setInput] = useState('')
  const clear = () => setInput('')
  useToolShortcuts({ clear })
  const r = useMemo(() => {
    if (!input.trim()) return null
    try { return { ok: true as const, u: parseUrl(input) } } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [input])
  const fields: [string, string][] = r?.ok ? [
    ['Protocol', r.u.protocol], ['Host', r.u.hostname], ['Port', r.u.port], ['Path', r.u.pathname], ['Query', r.u.search], ['Hash', r.u.hash], ['Username', r.u.username], ['Password', r.u.password], ['Origin', r.u.origin],
  ] : []
  return (
    <>
      <ToolInput label="URL" value={input} onChange={setInput} rows={3} emptyHint="Paste a URL to break it into parts." onClear={clear} />
      {r && !r.ok && <ErrorMessage title="Invalid URL">{r.error}</ErrorMessage>}
      {r?.ok ? (
        <>
          <ToolSection title="Components">
            <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50">
              {fields.map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <dt className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 flex-1 break-all font-mono text-[13px]">{v || <span className="text-muted-foreground">—</span>}</dd>
                  <CopyButton value={v} iconOnly aria-label={`Copy ${k}`} variant="ghost" />
                </div>
              ))}
            </dl>
          </ToolSection>
          <ToolSection title="Query parameters"><QueryTable rows={r.u.params} /></ToolSection>
        </>
      ) : !r && <div className="rounded-md border border-dashed border-border"><EmptyState title="Parsed components will appear here." /></div>}
    </>
  )
}

export function QueryParser() {
  const [input, setInput] = useState('')
  const rows = useMemo(() => (input.trim() ? parseQuery(input) : null), [input])
  const clear = () => setInput('')
  useToolShortcuts({ clear })
  const json = useMemo(() => {
    if (!rows) return ''
    const o: Record<string, string | string[]> = {}
    for (const [k, v] of rows) o[k] = k in o ? [...([] as string[]).concat(o[k]), v] : v
    return JSON.stringify(o, null, 2)
  }, [rows])
  return (
    <>
      <ToolInput label="Query string or URL" value={input} onChange={setInput} rows={3} emptyHint="Paste a query string like ?page=2&sort=name." onClear={clear} />
      <ToolSection title="Parameters" actions={<><CopyButton value={json} label="Copy as JSON" /><ClearButton onClick={clear} shortcut={false} /></>}>
        {rows ? <QueryTable rows={rows} /> : <div className="rounded-md border border-dashed border-border"><EmptyState title="Parameters will appear here." /></div>}
      </ToolSection>
    </>
  )
}
