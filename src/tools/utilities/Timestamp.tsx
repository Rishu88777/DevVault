import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/fields'
import { CopyButton } from '@/components/common/CopyButton'
import { ErrorMessage } from '@/components/common/Feedback'
import { ToolSection, ToolSettings } from '@/components/tool/parts'
import { describeTimestamp, type TsUnit } from '@/lib/formatting/timestamp'
import { errorMessage } from '@/lib/utils'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm">
      <dt className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-all font-mono text-[13px]">{value}</dd>
      <CopyButton value={value} iconOnly variant="ghost" aria-label={`Copy ${label}`} />
    </div>
  )
}

export function TimestampConverter() {
  const [now, setNow] = useState(() => Date.now())
  const [value, setValue] = useState(() => String(Math.floor(Date.now() / 1000)))
  const [unit, setUnit] = useState<TsUnit | 'auto'>('auto')
  const [dateText, setDateText] = useState('')
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const res = useMemo(() => {
    if (!value.trim()) return null
    try { return { ok: true as const, d: describeTimestamp(value, unit, now) } } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [value, unit, now])
  const fromDate = useMemo(() => {
    if (!dateText.trim()) return null
    const d = new Date(dateText.trim())
    return Number.isNaN(d.getTime()) ? { error: 'Could not understand that date. Try an ISO format like 2024-05-17T10:30:00Z.' } : { s: Math.floor(d.getTime() / 1000), ms: d.getTime(), iso: d.toISOString() }
  }, [dateText])

  return (
    <>
      <ToolSection title="Current Unix time" actions={<Button size="sm" onClick={() => setValue(String(Math.floor(now / 1000)))}>Use now</Button>}>
        <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50">
          <Row label="Seconds" value={String(Math.floor(now / 1000))} /><Row label="Milliseconds" value={String(now)} />
        </dl>
      </ToolSection>
      <ToolSection title="Timestamp → date">
        <ToolSettings>
          <Field label="Unix timestamp" className="min-w-56 flex-1"><Input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" aria-label="Unix timestamp" placeholder="1700000000" /></Field>
          <Select label="Unit" value={unit} onChange={(v) => setUnit(v as TsUnit | 'auto')} options={[{ value: 'auto', label: 'Auto-detect' }, { value: 's', label: 'Seconds' }, { value: 'ms', label: 'Milliseconds' }]} className="w-40" />
        </ToolSettings>
        {res && !res.ok && <ErrorMessage title="Invalid timestamp">{res.error}</ErrorMessage>}
        {res?.ok && (
          <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50">
            <Row label="Detected unit" value={res.d.unit === 's' ? 'seconds' : 'milliseconds'} /><Row label="ISO 8601" value={res.d.iso} /><Row label="UTC" value={res.d.utc} /><Row label="Local" value={res.d.local} /><Row label="Relative" value={res.d.relative} />
          </dl>
        )}
      </ToolSection>
      <ToolSection title="Date → timestamp">
        <Field label="Date / time" hint="ISO 8601 or anything the browser can parse"><Input value={dateText} onChange={(e) => setDateText(e.target.value)} aria-label="Date and time" placeholder="2024-05-17T10:30:00Z" className="font-mono" /></Field>
        {fromDate && ('error' in fromDate ? <ErrorMessage title="Invalid date">{fromDate.error}</ErrorMessage> : (
          <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50">
            <Row label="Seconds" value={String(fromDate.s)} /><Row label="Milliseconds" value={String(fromDate.ms)} /><Row label="ISO 8601" value={fromDate.iso} />
          </dl>))}
        <p className="text-xs text-muted-foreground">Dates without a time zone are interpreted in your local time zone.</p>
      </ToolSection>
    </>
  )
}
