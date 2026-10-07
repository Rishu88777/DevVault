import { useMemo, useState } from 'react'
import { Field, Input } from '@/components/ui/fields'
import { CopyButton } from '@/components/common/CopyButton'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolSection, ToolSettings } from '@/components/tool/parts'
import { parseBase, toBase } from '@/lib/formatting/numbers'
import { errorMessage } from '@/lib/utils'

const BASES: [string, number][] = [['Binary', 2], ['Octal', 8], ['Decimal', 10], ['Hexadecimal', 16], ['Base 32', 32], ['Base 36', 36]]

export function NumberBaseConverter() {
  const [input, setInput] = useState('255')
  const [base, setBase] = useState('10')
  const [custom, setCustom] = useState('3')
  const res = useMemo(() => {
    if (!input.trim()) return null
    try {
      const v = parseBase(input, Number(base))
      const c = Number(custom)
      return { ok: true as const, v, rows: [...BASES, ...(Number.isInteger(c) && c >= 2 && c <= 36 && !BASES.some(([, b]) => b === c) ? [[`Base ${c}`, c] as [string, number]] : [])] }
    } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [input, base, custom])
  return (
    <>
      <ToolSettings>
        <Field label="Number" className="min-w-56 flex-1"><Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" aria-label="Number" /></Field>
        <Field label="Input base (2–36)"><Input inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} className="w-28" aria-label="Input base" /></Field>
        <Field label="Extra output base"><Input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-28" aria-label="Custom output base" /></Field>
      </ToolSettings>
      {res && !res.ok && <ErrorMessage title="Invalid number">{res.error}</ErrorMessage>}
      <ToolSection title="Results">
        {res?.ok ? (
          <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50">
            {res.rows.map(([name, b]) => { const out = toBase(res.v, b); return (
              <div key={b} className="flex items-center gap-3 px-3 py-2 text-sm"><dt className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{name}</dt><dd className="min-w-0 flex-1 break-all font-mono text-[13px]">{out}</dd><CopyButton value={out} iconOnly variant="ghost" aria-label={`Copy ${name}`} /></div>) })}
          </dl>
        ) : <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Enter a number to convert it.</p>}
      </ToolSection>
    </>
  )
}
