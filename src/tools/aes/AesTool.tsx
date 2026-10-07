import { useState } from 'react'
import { KeyRound, Lock, LockOpen, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/fields'
import { Tabs } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { Notice } from '@/components/common/Feedback'
import { ToolActions, ToolInput, ToolOutput, ToolSection, ToolSettings } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import {
  AES_MODES, DecryptError, aesDecrypt, aesEncrypt, decodeCipher, encodeCipher, generateAesKey, parseAesKey, type AesKeyBits, type AesMode, type KeyFormat,
} from '@/lib/crypto/aes'
import { bytesToBase64, bytesToHex, hexToBytes, base64ToBytes, utf8Decode, utf8Encode } from '@/lib/encoding/bytes'
import { errorMessage } from '@/lib/utils'

type Direction = 'encrypt' | 'decrypt'
const parseIv = (v: string, f: KeyFormat) => (v.trim() === '' ? undefined : f === 'hex' ? hexToBytes(v) : f === 'base64' ? base64ToBytes(v) : utf8Encode(v))

export default function AesTool() {
  const [dir, setDir] = useState<Direction>('encrypt')
  const [bits, setBits] = useState<AesKeyBits>(256)
  const [mode, setMode] = useState<AesMode>('GCM')
  const [text, setText] = useState('')
  const [key, setKey] = useState('')
  const [keyFmt, setKeyFmt] = useState<KeyFormat>('utf8')
  const [iv, setIv] = useState('')
  const [ivFmt, setIvFmt] = useState<'hex' | 'base64'>('hex')
  const [prepend, setPrepend] = useState(true)
  const [cipherFmt, setCipherFmt] = useState<'base64' | 'hex'>('base64')
  const [result, setResult] = useState('')
  const [usedIv, setUsedIv] = useState('')
  const [error, setError] = useState<{ message: string; hints?: string[] } | null>(null)
  const info = AES_MODES[mode]

  const run = async () => {
    setUsedIv('')
    try {
      const keyBytes = parseAesKey(key, keyFmt, bits)
      const ivBytes = parseIv(iv, ivFmt)
      if (dir === 'encrypt') {
        const r = await aesEncrypt({ mode, key: keyBytes, plaintext: utf8Encode(text), iv: ivBytes, prependIv: prepend })
        setResult(encodeCipher(r.output, cipherFmt))
        setUsedIv(ivFmt === 'hex' ? bytesToHex(r.iv) : bytesToBase64(r.iv))
      } else {
        const plain = await aesDecrypt({ mode, key: keyBytes, data: decodeCipher(text.trim(), cipherFmt), iv: ivBytes, ivPrepended: prepend })
        setResult(utf8Decode(plain))
      }
      setError(null)
    } catch (e) {
      setResult('')
      setError(e instanceof DecryptError ? { message: e.message, hints: e.hints } : { message: errorMessage(e), hints: dir === 'decrypt' ? ['Incorrect key', 'Incorrect IV', 'Incorrect encoding', 'Invalid ciphertext'] : undefined })
    }
  }
  const clear = () => { setText(''); setResult(''); setError(null); setUsedIv('') }
  useToolShortcuts({ run, clear })

  const genKey = () => {
    const k = generateAesKey(bits)
    setKeyFmt('hex'); setKey(bytesToHex(k))
  }
  const ivBytesNeeded = info.ivBytes

  return (
    <>
      <Tabs label="Direction" value={dir} onChange={(d) => { setDir(d); setResult(''); setError(null); setText('') }} items={[{ value: 'encrypt', label: 'Encrypt' }, { value: 'decrypt', label: 'Decrypt' }]} />
      <ToolSettings>
        <Select label="Algorithm" value={String(bits)} onChange={(v) => setBits(Number(v) as AesKeyBits)} options={[{ value: '128', label: 'AES-128' }, { value: '192', label: 'AES-192' }, { value: '256', label: 'AES-256' }]} className="w-36" />
        <Select label="Mode" value={mode} onChange={(v) => setMode(v as AesMode)} className="w-56" options={[
          { value: 'GCM', label: 'GCM (recommended)' }, { value: 'CBC', label: 'CBC' }, { value: 'CTR', label: 'CTR' }, { value: 'ECB', label: 'ECB — unavailable', disabled: true }]} />
      </ToolSettings>
      {mode === 'GCM' ? <Notice title="AES-GCM">{info.description}</Notice> : <Notice tone="warning" title={`AES-${mode} is not authenticated`}>{info.description}</Notice>}
      <ToolInput label={dir === 'encrypt' ? 'Plaintext (UTF-8 text)' : `Ciphertext (${cipherFmt === 'hex' ? 'Hex' : 'Base64'})`} value={text} onChange={setText} rows={6}
        emptyHint={dir === 'encrypt' ? 'Type or paste the text to encrypt.' : 'Paste the ciphertext to decrypt.'} onClear={clear} />
      <ToolSection title="Key">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label={`Secret key — exactly ${bits / 8} bytes`} hint={`${bits}-bit`}>
            <Input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Secret key" className="font-mono" placeholder={keyFmt === 'utf8' ? `${bits / 8}-character key` : keyFmt === 'hex' ? `${bits / 4} hex digits` : 'Base64 key'} />
          </Field>
          <Select label="Key format" value={keyFmt} onChange={(v) => setKeyFmt(v as KeyFormat)} options={[{ value: 'utf8', label: 'UTF-8' }, { value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]} className="sm:w-36" />
        </div>
        <Button size="sm" onClick={genKey}><KeyRound /> Generate random {bits}-bit key</Button>
        <p className="text-xs text-muted-foreground">Keys are used as-is (no key derivation). A random key from crypto.getRandomValues() is far stronger than a typed password.</p>
      </ToolSection>
      <ToolSection title={info.ivLabel}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Textarea value={iv} onChange={(e) => setIv(e.target.value)} rows={1} aria-label="IV or nonce" className="min-h-9 resize-none" placeholder={dir === 'encrypt' ? 'Leave empty to generate a secure random value' : prepend ? 'Not needed — read from the start of the ciphertext' : `${ivBytesNeeded} bytes`} />
          <Select value={ivFmt} onChange={(v) => setIvFmt(v as 'hex' | 'base64')} options={[{ value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]} className="sm:w-36" aria-label="IV format" />
        </div>
        <Checkbox label={`Prepend the ${ivBytesNeeded}-byte IV to the output (decrypt: IV is the first ${ivBytesNeeded} bytes of the input)`} checked={prepend} onChange={setPrepend} />
      </ToolSection>
      <ToolSettings>
        <Select label={dir === 'encrypt' ? 'Output format' : 'Ciphertext format'} value={cipherFmt} onChange={(v) => setCipherFmt(v as 'base64' | 'hex')} options={[{ value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }]} className="w-40" />
        <p className="max-w-md pb-1 text-xs text-muted-foreground">
          Output layout: {prepend ? `IV (${ivBytesNeeded} B) ‖ ` : ''}ciphertext{mode === 'GCM' ? ' ‖ 16-byte authentication tag' : mode === 'CBC' ? ' (PKCS#7 padded)' : ''}.
        </p>
      </ToolSettings>
      <ToolActions>
        <Tooltip label={dir === 'encrypt' ? 'Encrypt' : 'Decrypt'} shortcut="Mod+Enter" side="top">
          <Button variant="primary" onClick={run} disabled={!text || !key}>{dir === 'encrypt' ? <Lock /> : <LockOpen />} {dir === 'encrypt' ? 'Encrypt' : 'Decrypt'}</Button>
        </Tooltip>
        {dir === 'encrypt' && <Button variant="ghost" onClick={() => setIv('')} disabled={!iv}><Shuffle /> Use a new random IV</Button>}
      </ToolActions>
      <ToolOutput label="Result" value={result} error={error?.message} errorHints={error?.hints} errorTitle={dir === 'decrypt' ? 'Unable to decrypt data' : 'Unable to encrypt'} onClear={clear} wrapLong filename={dir === 'encrypt' ? 'ciphertext.txt' : 'plaintext.txt'}
        emptyTitle="The result will appear here." />
      {usedIv && !prepend && <Notice title={`${info.ivLabel.split(' (')[0]} used`}><code className="break-all font-mono text-xs">{usedIv}</code><br />Keep this — you need it to decrypt.</Notice>}
    </>
  )
}
