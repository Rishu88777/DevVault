import { base64UrlToBytes, bytesToBase64Url, utf8Decode, utf8Encode } from '../encoding/bytes'
import { pemToDer } from './pem'

export interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  parts: [string, string, string]
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.')
  if (parts.length !== 3) throw new Error(`A JWT has 3 dot-separated parts, but this has ${parts.length}.`)
  const parse = (p: string, label: string) => {
    try {
      const v = JSON.parse(utf8Decode(base64UrlToBytes(p)))
      if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error()
      return v as Record<string, unknown>
    } catch {
      throw new Error(`The ${label} is not valid Base64URL-encoded JSON.`)
    }
  }
  return { header: parse(parts[0], 'header'), payload: parse(parts[1], 'payload'), signature: parts[2], parts: parts as [string, string, string] }
}

export type JwtAlg = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512'
export const JWT_ALGS: JwtAlg[] = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']
const hashOf = (alg: string) => `SHA-${alg.slice(2)}`
const curveOf = (alg: string) => ({ ES256: 'P-256', ES384: 'P-384', ES512: 'P-521' })[alg as 'ES256']

function keyAlgo(alg: JwtAlg): { import: AlgorithmIdentifier | HmacImportParams | RsaHashedImportParams | EcKeyImportParams; sign: AlgorithmIdentifier | EcdsaParams } {
  if (alg.startsWith('HS')) return { import: { name: 'HMAC', hash: hashOf(alg) }, sign: { name: 'HMAC' } }
  if (alg.startsWith('RS')) return { import: { name: 'RSASSA-PKCS1-v1_5', hash: hashOf(alg) }, sign: { name: 'RSASSA-PKCS1-v1_5' } }
  return { import: { name: 'ECDSA', namedCurve: curveOf(alg) }, sign: { name: 'ECDSA', hash: hashOf(alg) } }
}

export async function signJwt(alg: JwtAlg, header: object, payload: object, key: string): Promise<string> {
  const signingInput = `${bytesToBase64Url(utf8Encode(JSON.stringify({ ...header, alg })))}.${bytesToBase64Url(utf8Encode(JSON.stringify(payload)))}`
  const a = keyAlgo(alg)
  let k: CryptoKey
  try {
    k = alg.startsWith('HS')
      ? await crypto.subtle.importKey('raw', utf8Encode(key) as BufferSource, a.import, false, ['sign'])
      : await crypto.subtle.importKey('pkcs8', pemToDer(key, 'PRIVATE KEY') as BufferSource, a.import, false, ['sign'])
  } catch {
    if (alg.startsWith('HS')) throw new Error('Could not use this secret as an HMAC key (is it empty?).')
    throw new Error(`Could not import the private key. It must be a PKCS#8 PEM ("BEGIN PRIVATE KEY") matching ${alg}.`)
  }
  const sig = new Uint8Array(await crypto.subtle.sign(a.sign, k, utf8Encode(signingInput) as BufferSource))
  return `${signingInput}.${bytesToBase64Url(sig)}`
}

export type VerifyResult = { valid: true } | { valid: false; reason: string }

export async function verifyJwt(token: string, key: string): Promise<VerifyResult> {
  const { header, parts } = decodeJwt(token)
  const alg = header.alg as string
  if (!JWT_ALGS.includes(alg as JwtAlg)) {
    return { valid: false, reason: alg === 'none' ? 'Unsigned token (alg "none") — there is nothing to verify, and it must not be trusted.' : `Unsupported algorithm: ${String(alg)}` }
  }
  const a = keyAlgo(alg as JwtAlg)
  try {
    const k = alg.startsWith('HS')
      ? await crypto.subtle.importKey('raw', utf8Encode(key) as BufferSource, a.import, false, ['verify'])
      : await crypto.subtle.importKey('spki', pemToDer(key, 'PUBLIC KEY') as BufferSource, a.import, false, ['verify'])
    const ok = await crypto.subtle.verify(a.sign, k, base64UrlToBytes(parts[2]) as BufferSource, utf8Encode(`${parts[0]}.${parts[1]}`) as BufferSource)
    return ok ? { valid: true } : { valid: false, reason: 'Signature does not match. The key is wrong or the token was modified.' }
  } catch {
    return { valid: false, reason: alg.startsWith('HS') ? 'Could not verify with this secret.' : 'Could not import the public key. It must be an SPKI PEM ("BEGIN PUBLIC KEY") matching the algorithm.' }
  }
}

export interface ClaimInfo { key: string; label: string; value: string; raw: unknown }
const TIME_CLAIMS: [string, string][] = [['iat', 'Issued At'], ['exp', 'Expiration'], ['nbf', 'Not Before']]
export const formatUnix = (n: number) => new Date(n * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC')

export function summarizeClaims(header: Record<string, unknown>, payload: Record<string, unknown>, now = Date.now()): ClaimInfo[] {
  const out: ClaimInfo[] = []
  const add = (key: string, label: string, raw: unknown, value?: string) => {
    if (raw === undefined) return
    out.push({ key, label, raw, value: value ?? (typeof raw === 'string' ? raw : JSON.stringify(raw)) })
  }
  add('alg', 'Algorithm', header.alg)
  add('typ', 'Token type', header.typ)
  add('iss', 'Issuer', payload.iss)
  add('sub', 'Subject', payload.sub)
  add('aud', 'Audience', payload.aud, Array.isArray(payload.aud) ? payload.aud.join(', ') : undefined)
  for (const [k, label] of TIME_CLAIMS) {
    const v = payload[k]
    if (typeof v === 'number') {
      let value = formatUnix(v)
      if (k === 'exp') value += v * 1000 < now ? '  (expired)' : '  (not yet expired)'
      if (k === 'nbf') value += v * 1000 > now ? '  (not valid yet)' : ''
      add(k, label, v, value)
    } else add(k, label, v)
  }
  return out
}
