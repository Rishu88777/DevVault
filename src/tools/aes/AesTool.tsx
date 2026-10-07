import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Panel } from '@/components/ui/panel'
import { useLiveResult } from '@/hooks/useLiveResult'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/fields'
import { Pills } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { ToolOutput } from '@/components/tool/parts'
import {
  AES_MODES, DecryptError, aesDecrypt, aesEncrypt, decodeCipher, encodeCipher, generateAesKey, parseAesKey, type AesKeyBits, type AesMode, type KeyFormat,
} from '@/lib/crypto/aes'
import { base64ToBytes, bytesToHex, hexToBytes, utf8Decode, utf8Encode } from '@/lib/encoding/bytes'
import { cn, errorMessage } from '@/lib/utils'

type Dir = 'encrypt' | 'decrypt'
type TextFmt = 'utf8' | 'hex' | 'base64'
const FMT = [{ value: 'utf8' as const, label: 'Plain Text' }, { value: 'base64' as const, label: 'Base64' }, { value: 'hex' as const, label: 'Hex' }]
const parseIv = (v: string, f: TextFmt) => (v.trim() === '' ? undefined : f === 'hex' ? hexToBytes(v) : f === 'base64' ? base64ToBytes(v) : utf8Encode(v))

function AesPanel({ dir }: { dir: Dir }) {
  const enc = dir === 'encrypt'
  const [text, setText] = useState('')
  const [key, setKey] = useState('')
  const [keyFmt, setKeyFmt] = useState<KeyFormat>('utf8')
  const [mode, setMode] = useState<AesMode>('GCM')
  const [bits, setBits] = useState<AesKeyBits>(256)
  const [iv, setIv] = useState('')
  const [ivFmt, setIvFmt] = useState<TextFmt>('hex')
  const [prepend, setPrepend] = useState(true)
  const [cipherFmt, setCipherFmt] = useState<'base64' | 'hex'>('base64')
  const info = AES_MODES[mode]
  // Converts automatically once text and key are present. Leaving the IV empty (encrypt) picks a fresh random one each run.
  const ready = text !== '' && key !== ''
  const { value: out, error: err } = useLiveResult(async () => {
    const k = parseAesKey(key, keyFmt, bits)
    const ivBytes = parseIv(iv, ivFmt)
    if (enc) {
      const r = await aesEncrypt({ mode, key: k, plaintext: utf8Encode(text), iv: ivBytes, prependIv: prepend })
      return { text: encodeCipher(r.output, cipherFmt), iv: bytesToHex(r.iv) }
    }
    return { text: utf8Decode(await aesDecrypt({ mode, key: k, data: decodeCipher(text.trim(), cipherFmt), iv: ivBytes, ivPrepended: prepend })), iv: '' }
  }, [text, key, keyFmt, mode, bits, iv, ivFmt, prepend, cipherFmt, enc], { enabled: ready, delay: 250 })
  const result = ready ? out?.text ?? '' : ''
  const usedIv = ready ? out?.iv ?? '' : ''
  const error = ready && err ? (err instanceof DecryptError ? { message: err.message, hints: err.hints } : { message: errorMessage(err), hints: enc ? undefined : ['Incorrect key', 'Incorrect IV', 'Incorrect encoding', 'Invalid ciphertext'] }) : null
  const clear = () => setText('')

  return (
    <Panel title={`AES ${enc ? 'Encryption' : 'Decryption'}`} category="Encryption">
      <Field label={enc ? 'Enter plain text to encrypt' : `Enter ${cipherFmt === 'hex' ? 'hex' : 'Base64'} ciphertext to decrypt`}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} aria-label={enc ? 'Plaintext' : 'Ciphertext'} placeholder={enc ? 'Type or paste the text you want to encrypt…' : 'Paste the encrypted text you want to decrypt…'} />
      </Field>

      <Field label={`Secret key (${bits / 8} bytes for AES-${bits})`}>
        <div className="flex gap-2">
          <Input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} aria-label={`${dir} secret key`} className="font-mono" placeholder={`Enter a ${bits / 8}-byte secret key`} />
          {enc && <Tooltip label={`Generate random ${bits}-bit key`}><Button size="icon" aria-label="Generate random key" onClick={() => { setKeyFmt('hex'); setKey(bytesToHex(generateAesKey(bits))) }}><KeyRound /></Button></Tooltip>}
        </div>
      </Field>
      <Field label="Secret key format"><Pills label="Secret key format" value={keyFmt} onChange={setKeyFmt} items={FMT} /></Field>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Cipher mode" value={mode} onChange={(v) => setMode(v as AesMode)} options={[{ value: 'GCM', label: 'GCM (recommended)' }, { value: 'CBC', label: 'CBC' }, { value: 'CTR', label: 'CTR' }, { value: 'ECB', label: 'ECB (not supported)', disabled: true }]} />
        <Select label="Key size in bits" value={String(bits)} onChange={(v) => setBits(Number(v) as AesKeyBits)} options={[{ value: '128', label: '128' }, { value: '192', label: '192' }, { value: '256', label: '256' }]} />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">{info.authenticated ? 'GCM is authenticated: it detects wrong keys and tampering. Tag: 16 bytes, appended.' : `AES-${mode} is not authenticated — tampering is not detected. Prefer GCM.`} ECB is not offered because it is insecure.</p>

      <Field label={`${info.ivLabel} — optional`}>
        <Input value={iv} onChange={(e) => setIv(e.target.value)} aria-label={`${dir} IV`} className="font-mono" placeholder={enc ? 'Empty = secure random' : prepend ? 'Empty = read from start of ciphertext' : `${info.ivBytes} bytes`} />
      </Field>
      <Field label="IV format"><Pills label="IV format" value={ivFmt} onChange={setIvFmt} items={FMT} /></Field>
      <label className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-[hsl(var(--accent))]" checked={prepend} onChange={(e) => setPrepend(e.target.checked)} /> <span>{enc ? `Put the ${info.ivBytes}-byte IV at the start of the output` : `The IV is the first ${info.ivBytes} bytes of the ciphertext`}</span></label>

      <Field label={enc ? 'Output text format' : 'Ciphertext format'}><Pills label="Ciphertext format" value={cipherFmt} onChange={setCipherFmt} items={[{ value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }]} /></Field>

      <p className={cn('rounded-md px-3 py-2 text-xs', ready ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>{ready ? (enc ? 'Encrypting automatically as you type.' : 'Decrypting automatically as you type.') : `Enter ${enc ? 'text' : 'ciphertext'} and a secret key — the result appears automatically.`}</p>
      <ToolOutput label={enc ? 'AES encrypted output' : 'AES decrypted output'} value={result} error={error?.message} errorHints={error?.hints} errorTitle={enc ? 'Unable to encrypt' : 'Unable to decrypt data'} onClear={clear} wrapLong shortcuts={false} height="h-32" emptyTitle="The result appears here automatically." filename={enc ? 'ciphertext.txt' : 'plaintext.txt'} />
      {usedIv && !prepend && <p className="text-xs text-muted-foreground">IV used (hex): <code className="break-all font-mono">{usedIv}</code> — keep it, you need it to decrypt.</p>}
    </Panel>
  )
}

export default function AesTool() {
  return (
    <div className="grid gap-x-10 gap-y-12 lg:grid-cols-2">
      <AesPanel dir="encrypt" />
      <AesPanel dir="decrypt" />
    </div>
  )
}
