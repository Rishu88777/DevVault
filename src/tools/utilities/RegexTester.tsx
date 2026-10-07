import { Fragment, useMemo, useState } from 'react'
import { Checkbox, Field, Input } from '@/components/ui/fields'
import { ErrorMessage, Notice } from '@/components/common/Feedback'
import { ToolInput, ToolSection, ToolSettings } from '@/components/tool/parts'
import { errorMessage } from '@/lib/utils'

const FLAGS: [string, string][] = [['g', 'global'], ['i', 'ignore case'], ['m', 'multiline'], ['s', 'dotAll'], ['u', 'unicode']]
const LIMIT = 1000

export function RegexTester() {
  const [pattern, setPattern] = useState('(?<word>\\b\\w{5}\\b)')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')

  const res = useMemo(() => {
    if (!pattern) return null
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      const matches: RegExpExecArray[] = []
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) && matches.length < LIMIT) {
        matches.push(m)
        if (m[0] === '') re.lastIndex++
        if (!flags.includes('g')) break
      }
      return { ok: true as const, matches, truncated: matches.length >= LIMIT }
    } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [pattern, flags, text])

  const parts = useMemo(() => {
    if (!res?.ok) return []
    const out: { text: string; hit: boolean }[] = []
    let i = 0
    for (const m of res.matches) {
      if (m[0] === '') continue
      if (m.index > i) out.push({ text: text.slice(i, m.index), hit: false })
      out.push({ text: m[0], hit: true })
      i = m.index + m[0].length
    }
    if (i < text.length) out.push({ text: text.slice(i), hit: false })
    return out
  }, [res, text])

  return (
    <>
      <ToolSettings className="items-start">
        <Field label="Pattern" className="min-w-64 flex-1"><Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" aria-label="Regular expression" placeholder="e.g. ^\d+$" /></Field>
        <div className="space-y-1.5"><p className="text-xs font-medium text-muted-foreground">Flags</p><div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5">{FLAGS.map(([f, label]) => <Checkbox key={f} label={<span title={label}>{f}</span>} checked={flags.includes(f)} onChange={(on) => setFlags((p) => (on ? p + f : p.replace(f, '')))} />)}</div></div>
      </ToolSettings>
      <ToolInput label="Test string" value={text} onChange={setText} rows={7} emptyHint="Paste text to test your pattern against." onClear={() => setText('')} />
      {res && !res.ok && <ErrorMessage title="Invalid regular expression">{res.error}</ErrorMessage>}
      {res?.ok && (
        <>
          <ToolSection title={`Matches (${res.matches.length}${res.truncated ? '+' : ''})`}>
            <pre tabIndex={0} aria-label="Highlighted matches" className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-input bg-background/60 px-3 py-2.5 font-mono text-[13px] leading-5">
              {text ? parts.map((p, i) => (p.hit ? <mark key={i} className="rounded bg-accent/25 px-0.5 text-foreground">{p.text}</mark> : <Fragment key={i}>{p.text}</Fragment>)) : <span className="text-muted-foreground">Nothing to match yet.</span>}
            </pre>
          </ToolSection>
          {res.truncated && <Notice tone="warning">Showing only the first {LIMIT} matches.</Notice>}
          {res.matches.length > 0 && (
            <ToolSection title="Match details">
              <ol className="max-h-80 space-y-1.5 overflow-auto">
                {res.matches.slice(0, 100).map((m, i) => (
                  <li key={i} className="rounded-md border border-border bg-card/50 px-3 py-2 font-mono text-[13px]">
                    <span className="text-muted-foreground">#{i + 1} @ {m.index}</span> <span className="break-all">“{m[0]}”</span>
                    {m.length > 1 && <div className="mt-1 text-xs text-muted-foreground">{m.slice(1).map((g, gi) => <span key={gi} className="mr-3">${gi + 1}: <span className="text-foreground">{g === undefined ? 'undefined' : `“${g}”`}</span></span>)}</div>}
                    {m.groups && <div className="mt-1 text-xs text-muted-foreground">{Object.entries(m.groups).map(([k, v]) => <span key={k} className="mr-3">{k}: <span className="text-foreground">{v === undefined ? 'undefined' : `“${v}”`}</span></span>)}</div>}
                  </li>
                ))}
              </ol>
              {res.matches.length > 100 && <p className="text-xs text-muted-foreground">Details shown for the first 100 matches.</p>}
            </ToolSection>
          )}
        </>
      )}
    </>
  )
}
