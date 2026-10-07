import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select } from '@/components/ui/fields'
import { Tooltip } from '@/components/ui/tooltip'
import { Notice } from '@/components/common/Feedback'
import { ToolActions, ToolOutput, ToolSettings } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { generatePassword, passwordEntropyBits, randomString, uuidV4, uuidV7, type PasswordOptions } from '@/lib/crypto/random'
import { cn, errorMessage } from '@/lib/utils'

const clampInt = (v: string, min: number, max: number, fallback: number) => {
  const n = Number(v)
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function UuidGenerator() {
  const [version, setVersion] = useState<'v4' | 'v7'>('v4')
  const [count, setCount] = useState('5')
  const [upper, setUpper] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [list, setList] = useState<string[]>([])
  const generate = () => setList(Array.from({ length: clampInt(count, 1, 1000, 1) }, () => (version === 'v4' ? uuidV4() : uuidV7())))
  useEffect(generate, []) // eslint-disable-line react-hooks/exhaustive-deps
  const out = useMemo(() => list.map((u) => { let s = hyphens ? u : u.replace(/-/g, ''); if (upper) s = s.toUpperCase(); return s }).join('\n'), [list, upper, hyphens])
  useToolShortcuts({ run: generate, clear: () => setList([]) })
  return (
    <>
      <ToolSettings>
        <Select label="Version" value={version} onChange={(v) => setVersion(v as 'v4' | 'v7')} options={[{ value: 'v4', label: 'UUID v4 (random)' }, { value: 'v7', label: 'UUID v7 (time-ordered)' }]} className="w-56" />
        <Field label="How many (1–1000)"><Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className="w-28" aria-label="Number of UUIDs" /></Field>
        <div className="flex gap-4 pb-2"><Checkbox label="Uppercase" checked={upper} onChange={setUpper} /><Checkbox label="Hyphens" checked={hyphens} onChange={setHyphens} /></div>
      </ToolSettings>
      <ToolActions><Tooltip label="Generate" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={generate}><RefreshCw /> Generate</Button></Tooltip></ToolActions>
      <ToolOutput label={`UUID${list.length > 1 ? 's' : ''}`} value={out} onClear={() => setList([])} filename="uuids.txt" />
    </>
  )
}

export function PasswordGenerator() {
  const [o, setO] = useState<PasswordOptions>({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false })
  const [count, setCount] = useState('1')
  const [out, setOut] = useState('')
  const [error, setError] = useState<string | null>(null)
  const generate = () => {
    try { setOut(Array.from({ length: clampInt(count, 1, 50, 1) }, () => generatePassword(o)).join('\n')); setError(null) } catch (e) { setOut(''); setError(errorMessage(e)) }
  }
  useEffect(generate, []) // eslint-disable-line react-hooks/exhaustive-deps
  useToolShortcuts({ run: generate, clear: () => setOut('') })
  const bits = passwordEntropyBits(o)
  const strength = bits >= 100 ? ['Very strong', 'bg-success'] : bits >= 70 ? ['Strong', 'bg-success'] : bits >= 50 ? ['Fair', 'bg-warning'] : ['Weak', 'bg-danger']
  const set = <K extends keyof PasswordOptions>(k: K, v: PasswordOptions[K]) => setO((p) => ({ ...p, [k]: v }))
  return (
    <>
      <ToolSettings className="items-start">
        <Field label={`Length: ${o.length}`} className="w-full sm:w-72">
          <input type="range" min={4} max={128} value={o.length} onChange={(e) => set('length', Number(e.target.value))} aria-label="Password length" className="h-9 w-full accent-[hsl(var(--accent))]" />
        </Field>
        <Field label="Count (1–50)"><Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" aria-label="Number of passwords" /></Field>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
          <Checkbox label="Uppercase" checked={o.uppercase} onChange={(v) => set('uppercase', v)} />
          <Checkbox label="Lowercase" checked={o.lowercase} onChange={(v) => set('lowercase', v)} />
          <Checkbox label="Numbers" checked={o.numbers} onChange={(v) => set('numbers', v)} />
          <Checkbox label="Symbols" checked={o.symbols} onChange={(v) => set('symbols', v)} />
          <div className="col-span-2"><Checkbox label="Exclude ambiguous characters (I l 1 O 0 o)" checked={o.excludeAmbiguous} onChange={(v) => set('excludeAmbiguous', v)} /></div>
        </div>
      </ToolSettings>
      <ToolActions>
        <Tooltip label="Generate" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={generate}><RefreshCw /> Generate</Button></Tooltip>
        <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full transition-all', strength[1])} style={{ width: `${Math.min(100, bits)}%` }} /></span>
          {strength[0]} · ~{bits} bits
        </div>
      </ToolActions>
      <ToolOutput label="Password" value={out} error={error} errorTitle="Check your options" onClear={() => setOut('')} filename="passwords.txt" wrapLong />
      <Notice>Generated entirely in your browser with crypto.getRandomValues(). Passwords are never stored or sent anywhere.</Notice>
    </>
  )
}

const CHARSETS: Record<string, { label: string; chars: string }> = {
  alnum: { label: 'Letters + digits', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' },
  hex: { label: 'Hex (lowercase)', chars: '0123456789abcdef' },
  base64url: { label: 'Base64URL alphabet', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_' },
  digits: { label: 'Digits only', chars: '0123456789' },
  upper: { label: 'Uppercase letters', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  lower: { label: 'Lowercase letters', chars: 'abcdefghijklmnopqrstuvwxyz' },
  custom: { label: 'Custom…', chars: '' },
}

export function RandomStringGenerator() {
  const [set, setSet] = useState('alnum')
  const [custom, setCustom] = useState('')
  const [length, setLength] = useState('32')
  const [count, setCount] = useState('1')
  const [out, setOut] = useState('')
  const [error, setError] = useState<string | null>(null)
  const chars = set === 'custom' ? custom : CHARSETS[set].chars
  const generate = () => {
    try {
      const len = clampInt(length, 1, 4096, 32)
      setOut(Array.from({ length: clampInt(count, 1, 100, 1) }, () => randomString(chars, len)).join('\n')); setError(null)
    } catch (e) { setOut(''); setError(errorMessage(e)) }
  }
  useEffect(generate, []) // eslint-disable-line react-hooks/exhaustive-deps
  useToolShortcuts({ run: generate, clear: () => setOut('') })
  const bits = chars ? Math.round(clampInt(length, 1, 4096, 32) * Math.log2(new Set(Array.from(chars)).size || 1)) : 0
  return (
    <>
      <ToolSettings>
        <Select label="Character set" value={set} onChange={setSet} options={Object.entries(CHARSETS).map(([value, c]) => ({ value, label: c.label }))} className="w-52" />
        {set === 'custom' && <Field label="Characters"><Input value={custom} onChange={(e) => setCustom(e.target.value)} className="w-64 font-mono" aria-label="Custom characters" placeholder="abc123" /></Field>}
        <Field label="Length"><Input inputMode="numeric" value={length} onChange={(e) => setLength(e.target.value)} className="w-24" aria-label="String length" /></Field>
        <Field label="Count"><Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" aria-label="Number of strings" /></Field>
      </ToolSettings>
      <ToolActions>
        <Tooltip label="Generate" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={generate}><RefreshCw /> Generate</Button></Tooltip>
        <span className="text-sm text-muted-foreground">~{bits} bits of entropy per string</span>
      </ToolActions>
      <ToolOutput label="Result" value={out} error={error} errorTitle="Check your options" onClear={() => setOut('')} filename="random.txt" wrapLong />
    </>
  )
}
