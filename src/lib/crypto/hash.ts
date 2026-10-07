import { sha224 } from '@noble/hashes/sha2.js'
import { md5 } from '@noble/hashes/legacy.js'
import { sha3_224, sha3_256, sha3_384, sha3_512, shake128, shake256 } from '@noble/hashes/sha3.js'
import { blake2b, blake2s } from '@noble/hashes/blake2.js'
import { hmac as nobleHmac } from '@noble/hashes/hmac.js'
import { sha1 as nobleSha1 } from '@noble/hashes/legacy.js'
import { sha256 as nobleSha256, sha384 as nobleSha384, sha512 as nobleSha512 } from '@noble/hashes/sha2.js'
import { bytesToBase64, bytesToBase64Url, bytesToHex } from '../encoding/bytes'

export type OutputFormat = 'hex' | 'HEX' | 'base64' | 'base64url'
export const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'hex', label: 'Hex (lowercase)' },
  { value: 'HEX', label: 'Hex (uppercase)' },
  { value: 'base64', label: 'Base64' },
  { value: 'base64url', label: 'Base64URL' },
]
export function formatOutput(b: Uint8Array, f: OutputFormat): string {
  if (f === 'hex') return bytesToHex(b)
  if (f === 'HEX') return bytesToHex(b, true)
  if (f === 'base64url') return bytesToBase64Url(b)
  return bytesToBase64(b)
}

export interface HashAlgorithm {
  id: string
  label: string
  engine: 'Web Crypto' | 'JS library (@noble/hashes)'
  /** Marked as cryptographically broken / legacy. */
  weak?: boolean
  variableLength?: boolean
  note?: string
  run: (data: Uint8Array, outBytes?: number) => Promise<Uint8Array> | Uint8Array
}

const subtle = (name: string) => async (d: Uint8Array) =>
  new Uint8Array(await crypto.subtle.digest(name, d as BufferSource))

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  { id: 'md5', label: 'MD5', engine: 'JS library (@noble/hashes)', weak: true, note: 'MD5 is broken for security purposes. Use only for checksums / legacy compatibility.', run: (d) => md5(d) },
  { id: 'sha1', label: 'SHA-1', engine: 'Web Crypto', weak: true, note: 'SHA-1 is deprecated for security use (collision attacks exist).', run: subtle('SHA-1') },
  { id: 'sha224', label: 'SHA-224', engine: 'JS library (@noble/hashes)', note: 'Not offered by Web Crypto, so a vetted JS library is used.', run: (d) => sha224(d) },
  { id: 'sha256', label: 'SHA-256', engine: 'Web Crypto', run: subtle('SHA-256') },
  { id: 'sha384', label: 'SHA-384', engine: 'Web Crypto', run: subtle('SHA-384') },
  { id: 'sha512', label: 'SHA-512', engine: 'Web Crypto', run: subtle('SHA-512') },
  { id: 'sha3-224', label: 'SHA3-224', engine: 'JS library (@noble/hashes)', run: (d) => sha3_224(d) },
  { id: 'sha3-256', label: 'SHA3-256', engine: 'JS library (@noble/hashes)', run: (d) => sha3_256(d) },
  { id: 'sha3-384', label: 'SHA3-384', engine: 'JS library (@noble/hashes)', run: (d) => sha3_384(d) },
  { id: 'sha3-512', label: 'SHA3-512', engine: 'JS library (@noble/hashes)', run: (d) => sha3_512(d) },
  { id: 'shake128', label: 'SHAKE128', engine: 'JS library (@noble/hashes)', variableLength: true, note: 'Extendable-output function; choose the output length.', run: (d, n = 32) => shake128(d, { dkLen: n }) },
  { id: 'shake256', label: 'SHAKE256', engine: 'JS library (@noble/hashes)', variableLength: true, note: 'Extendable-output function; choose the output length.', run: (d, n = 64) => shake256(d, { dkLen: n }) },
  { id: 'blake2b', label: 'BLAKE2b-512', engine: 'JS library (@noble/hashes)', run: (d) => blake2b(d) },
  { id: 'blake2s', label: 'BLAKE2s-256', engine: 'JS library (@noble/hashes)', run: (d) => blake2s(d) },
]

export const getHashAlgorithm = (id: string) => {
  const a = HASH_ALGORITHMS.find((x) => x.id === id)
  if (!a) throw new Error(`Unknown hash algorithm: ${id}`)
  return a
}

export async function hashBytes(id: string, data: Uint8Array, outBytes?: number): Promise<Uint8Array> {
  return getHashAlgorithm(id).run(data, outBytes)
}

/* ---------- HMAC ---------- */
export type HmacHash = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export const HMAC_HASHES: HmacHash[] = ['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1']
const NOBLE_HMAC = { 'SHA-1': nobleSha1, 'SHA-256': nobleSha256, 'SHA-384': nobleSha384, 'SHA-512': nobleSha512 }

export async function hmacBytes(hash: HmacHash, key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  // Web Crypto rejects zero-length HMAC keys, although HMAC defines them; fall back to the vetted library for that case only.
  if (key.length === 0) return nobleHmac(NOBLE_HMAC[hash], key, message)
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, message as BufferSource))
}
