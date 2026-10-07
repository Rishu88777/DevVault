import { useState } from 'react'
import { Hash, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/fields'
import { Tooltip } from '@/components/ui/tooltip'
import { Notice } from '@/components/common/Feedback'
import { ToolActions, ToolInput, ToolOutput, ToolSettings } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { BINARY_FORMAT_LABELS, parseBytes, type BinaryFormat } from '@/lib/encoding/bytes'
import { HASH_ALGORITHMS, HMAC_HASHES, OUTPUT_FORMATS, formatOutput, getHashAlgorithm, hashBytes, hmacBytes, type HmacHash, type OutputFormat } from '@/lib/crypto/hash'
import { errorMessage } from '@/lib/utils'

const FORMAT_OPTIONS = OUTPUT_FORMATS.map((f) => ({ value: f.value, label: f.label }))
const INPUT_FORMATS = (Object.keys(BINARY_FORMAT_LABELS) as BinaryFormat[]).map((k) => ({ value: k, label: BINARY_FORMAT_LABELS[k] }))

export function HashGenerator() {
  const [input, setInput] = useState('')
  const [inFmt, setInFmt] = useState<BinaryFormat>('utf8')
  const [algo, setAlgo] = useState('sha256')
  const [outFmt, setOutFmt] = useState<OutputFormat>('hex')
  const [len, setLen] = useState('32')
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)
  const a = getHashAlgorithm(algo)

  const run = async () => {
    try {
      const n = Number(len)
      if (a.variableLength && !(Number.isInteger(n) && n >= 1 && n <= 1024)) throw new Error('Output length must be a whole number from 1 to 1024 bytes.')
      setResult(formatOutput(await hashBytes(algo, parseBytes(input, inFmt), a.variableLength ? n : undefined), outFmt)); setError(null)
    } catch (e) { setResult(''); setError(errorMessage(e)) }
  }
  const clear = () => { setInput(''); setResult(''); setError(null) }
  useToolShortcuts({ run, clear })

  return (
    <>
      <Notice title="Hashing is one-way"><span>A hash cannot be decrypted. It is a fingerprint of the input, not an encrypted copy.</span></Notice>
      <ToolInput label="Input" value={input} onChange={setInput} emptyHint="Type or paste text to hash." onClear={clear} rows={6} />
      <ToolSettings>
        <Select label="Algorithm" value={algo} onChange={(v) => { setAlgo(v); setResult('') }} options={HASH_ALGORITHMS.map((x) => ({ value: x.id, label: x.label }))} className="w-44" />
        <Select label="Input format" value={inFmt} onChange={(v) => setInFmt(v as BinaryFormat)} options={INPUT_FORMATS} className="w-40" />
        <Select label="Output format" value={outFmt} onChange={(v) => setOutFmt(v as OutputFormat)} options={FORMAT_OPTIONS} className="w-44" />
        {a.variableLength && <Field label="Output bytes"><Input inputMode="numeric" value={len} onChange={(e) => setLen(e.target.value)} className="w-24" aria-label="Output length in bytes" /></Field>}
      </ToolSettings>
      <p className="-mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" /> Engine: {a.engine}.{a.note ? ` ${a.note}` : ''}</p>
      {a.weak && <Notice tone="warning" title="Not suitable for security">{a.note}</Notice>}
      <ToolActions><Tooltip label="Generate hash" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={run}><Hash /> Generate Hash</Button></Tooltip></ToolActions>
      <ToolOutput label="Result" value={result} error={error} errorTitle="Unable to hash" onClear={clear} filename={`${algo}.txt`} wrapLong emptyTitle="Your hash will appear here." />
    </>
  )
}

export function HmacGenerator() {
  const [message, setMessage] = useState('')
  const [key, setKey] = useState('')
  const [keyFmt, setKeyFmt] = useState<BinaryFormat>('utf8')
  const [hash, setHash] = useState<HmacHash>('SHA-256')
  const [outFmt, setOutFmt] = useState<OutputFormat>('hex')
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    try { setResult(formatOutput(await hmacBytes(hash, parseBytes(key, keyFmt), parseBytes(message, 'utf8')), outFmt)); setError(null) }
    catch (e) { setResult(''); setError(errorMessage(e)) }
  }
  const clear = () => { setMessage(''); setKey(''); setResult(''); setError(null) }
  useToolShortcuts({ run, clear })

  return (
    <>
      <ToolInput label="Message" value={message} onChange={setMessage} emptyHint="Type or paste the message to authenticate." onClear={clear} rows={5} />
      <ToolSettings className="items-start">
        <Field label="Secret key" className="min-w-64 flex-1"><Input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Secret key" aria-label="Secret key" className="font-mono" /></Field>
        <Select label="Key format" value={keyFmt} onChange={(v) => setKeyFmt(v as BinaryFormat)} options={INPUT_FORMATS} className="w-40" />
        <Select label="Algorithm" value={hash} onChange={(v) => setHash(v as HmacHash)} options={HMAC_HASHES.map((h) => ({ value: h, label: `HMAC-${h}` }))} className="w-44" />
        <Select label="Output format" value={outFmt} onChange={(v) => setOutFmt(v as OutputFormat)} options={FORMAT_OPTIONS} className="w-44" />
      </ToolSettings>
      {hash === 'SHA-1' && <Notice tone="warning" title="HMAC-SHA1">HMAC-SHA1 is still considered safe against known attacks, but prefer SHA-256 or stronger for new designs.</Notice>}
      <ToolActions><Tooltip label="Generate HMAC" shortcut="Mod+Enter" side="top"><Button variant="primary" onClick={run}><Hash /> Generate HMAC</Button></Tooltip></ToolActions>
      <ToolOutput label="HMAC" value={result} error={error} errorTitle="Unable to compute HMAC" onClear={clear} filename={`hmac-${hash.toLowerCase()}.txt`} wrapLong emptyTitle="Your HMAC will appear here." />
    </>
  )
}
