import { useMemo, useState } from 'react'
import { ShieldAlert, ShieldCheck, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/fields'
import { CodeView } from '@/components/common/CodeEditor'
import { CopyButton } from '@/components/common/CopyButton'
import { ErrorMessage, Notice } from '@/components/common/Feedback'
import { ToolActions, ToolInput, ToolOutput, ToolSection } from '@/components/tool/parts'
import { useToolShortcuts } from '@/hooks/useShortcut'
import { JWT_ALGS, decodeJwt, signJwt, summarizeClaims, verifyJwt, type JwtAlg, type VerifyResult } from '@/lib/crypto/jwt'
import { errorMessage } from '@/lib/utils'

const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export function JwtDecoder() {
  const [token, setToken] = useState('')
  const [key, setKey] = useState('')
  const [verdict, setVerdict] = useState<VerifyResult | null>(null)
  const [busy, setBusy] = useState(false)
  const decoded = useMemo(() => {
    if (!token.trim()) return null
    try { return { ok: true as const, d: decodeJwt(token) } } catch (e) { return { ok: false as const, error: errorMessage(e) } }
  }, [token])
  const alg = decoded?.ok ? String(decoded.d.header.alg ?? '') : ''
  const isHmac = alg.startsWith('HS')
  const claims = useMemo(() => (decoded?.ok ? summarizeClaims(decoded.d.header, decoded.d.payload) : []), [decoded])
  const clear = () => { setToken(''); setKey(''); setVerdict(null) }
  useToolShortcuts({ clear })

  const verify = async () => {
    setBusy(true)
    try { setVerdict(await verifyJwt(token, key)) } catch (e) { setVerdict({ valid: false, reason: errorMessage(e) }) } finally { setBusy(false) }
  }

  return (
    <>
      <ToolInput label="Encoded token" value={token} onChange={(v) => { setToken(v); setVerdict(null) }} rows={5} emptyHint="Paste a JWT to decode it." onClear={clear}
        actions={<Button size="sm" variant="ghost" onClick={() => setToken(SAMPLE)}>Use sample</Button>} />
      {decoded && !decoded.ok && <ErrorMessage title="Invalid JWT">{decoded.error}</ErrorMessage>}
      {decoded?.ok && (
        <>
          <Notice tone="warning" title="Decoding does not verify the signature">Anyone can create a token with any contents. Only the verification below proves it was signed with the right key.</Notice>
          <div className="grid gap-5 lg:grid-cols-2">
            <ToolSection title="Header" actions={<CopyButton value={JSON.stringify(decoded.d.header, null, 2)} />}><CodeView label="JWT header" language="json" height="h-44" value={JSON.stringify(decoded.d.header, null, 2)} /></ToolSection>
            <ToolSection title="Payload" actions={<CopyButton value={JSON.stringify(decoded.d.payload, null, 2)} />}><CodeView label="JWT payload" language="json" height="h-44" value={JSON.stringify(decoded.d.payload, null, 2)} /></ToolSection>
          </div>
          <ToolSection title="Signature" actions={<CopyButton value={decoded.d.signature} />}>
            <pre tabIndex={0} className="overflow-x-auto rounded-md border border-input bg-background/60 px-3 py-2.5 font-mono text-[13px] break-all whitespace-pre-wrap">{decoded.d.signature || '(empty — unsigned token)'}</pre>
          </ToolSection>
          {claims.length > 0 && (
            <ToolSection title="Claims">
              <dl className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card/50 sm:grid-cols-[11rem_1fr] sm:divide-y-0">
                {claims.map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="px-3 pt-2.5 text-xs font-medium text-muted-foreground sm:border-t sm:border-border sm:py-2.5 sm:first:border-t-0">{c.label} <code className="ml-1 text-[11px] opacity-60">{c.key}</code></dt>
                    <dd className="break-all px-3 pb-2.5 font-mono text-[13px] sm:border-t sm:border-border sm:py-2.5 sm:first:border-t-0 [&:nth-child(2)]:border-t-0">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </ToolSection>
          )}
          <ToolSection title="Verify signature (optional)">
            <Field label={isHmac ? 'Shared secret' : 'Public key (SPKI PEM)'} hint={alg ? `Algorithm: ${alg}` : undefined}>
              {isHmac
                ? <Input type="password" autoComplete="off" value={key} onChange={(e) => { setKey(e.target.value); setVerdict(null) }} className="font-mono" aria-label="Shared secret" placeholder="your-256-bit-secret" />
                : <Textarea rows={5} value={key} onChange={(e) => { setKey(e.target.value); setVerdict(null) }} aria-label="Public key" placeholder="-----BEGIN PUBLIC KEY-----" className="text-xs" />}
            </Field>
            <ToolActions><Button variant="primary" onClick={verify} disabled={busy || !key}><ShieldCheck /> Verify signature</Button></ToolActions>
            {verdict && (verdict.valid
              ? <div role="status" className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm font-medium text-success"><ShieldCheck className="size-4" /> Signature verified.</div>
              : <div role="status" className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger"><ShieldAlert className="size-4 shrink-0" /> {verdict.reason}</div>)}
          </ToolSection>
        </>
      )}
    </>
  )
}

const nowSec = () => Math.floor(Date.now() / 1000)

export function JwtGenerator() {
  const [alg, setAlg] = useState<JwtAlg>('HS256')
  const [header, setHeader] = useState('{\n  "typ": "JWT"\n}')
  const [payload, setPayload] = useState(() => JSON.stringify({ sub: '1234567890', name: 'Jane Doe', iat: nowSec(), exp: nowSec() + 3600 }, null, 2))
  const [key, setKey] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const hmac = alg.startsWith('HS')

  const run = async () => {
    try {
      const h = JSON.parse(header), p = JSON.parse(payload)
      if (typeof h !== 'object' || h === null || typeof p !== 'object' || p === null) throw new Error('Header and payload must be JSON objects.')
      setToken(await signJwt(alg, h, p, key)); setError(null)
    } catch (e) { setToken(''); setError(e instanceof SyntaxError ? `Header or payload is not valid JSON: ${e.message}` : errorMessage(e)) }
  }
  const clear = () => { setToken(''); setError(null) }
  useToolShortcuts({ run, clear })

  return (
    <>
      <Notice title="A signature is not secrecy">The payload of a signed JWT is readable by anyone. Don&apos;t put secrets in it. Whoever holds the signing key can create valid tokens.</Notice>
      <Select label="Algorithm" value={alg} onChange={(v) => { setAlg(v as JwtAlg); setKey('') }} options={JWT_ALGS.map((a) => ({ value: a, label: `${a} — ${a.startsWith('HS') ? 'HMAC' : a.startsWith('RS') ? 'RSA PKCS#1 v1.5' : 'ECDSA'}` }))} className="w-64" />
      <div className="grid gap-5 lg:grid-cols-2">
        <ToolSection title="Header (alg is set automatically)"><Textarea value={header} onChange={(e) => setHeader(e.target.value)} rows={6} aria-label="Header JSON" /></ToolSection>
        <ToolSection title="Payload"><Textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={6} aria-label="Payload JSON" /></ToolSection>
      </div>
      <ToolSection title={hmac ? 'Secret' : 'Private key (PKCS#8 PEM)'}>
        {hmac
          ? <Input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} className="font-mono" aria-label="Secret" placeholder="Shared secret (use 32+ random characters)" />
          : <Textarea value={key} onChange={(e) => setKey(e.target.value)} rows={5} aria-label="Private key" placeholder="-----BEGIN PRIVATE KEY-----" className="text-xs" />}
      </ToolSection>
      <ToolActions><Button variant="primary" onClick={run} disabled={!key}><Ticket /> Generate token</Button></ToolActions>
      <ToolOutput label="Signed token" value={token} error={error} errorTitle="Unable to generate token" onClear={clear} wrapLong filename="token.jwt" emptyTitle="Your token will appear here." />
    </>
  )
}
