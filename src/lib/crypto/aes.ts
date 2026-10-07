import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes, utf8Encode } from '../encoding/bytes'
import { randomBytes } from './random'

export type AesMode = 'GCM' | 'CBC' | 'CTR'
export type AesKeyBits = 128 | 192 | 256
export type KeyFormat = 'utf8' | 'hex' | 'base64'

export const AES_MODES: Record<AesMode, { name: string; ivBytes: number; ivLabel: string; authenticated: boolean; description: string }> = {
  GCM: { name: 'AES-GCM', ivBytes: 12, ivLabel: 'Nonce (12 bytes)', authenticated: true, description: 'Authenticated encryption. A 96-bit nonce is used; a 128-bit authentication tag is appended to the ciphertext. Never reuse a nonce with the same key.' },
  CBC: { name: 'AES-CBC', ivBytes: 16, ivLabel: 'IV (16 bytes)', authenticated: false, description: 'Unauthenticated: ciphertext can be modified without detection. PKCS#7 padding is applied. Prefer GCM unless you must interoperate.' },
  CTR: { name: 'AES-CTR', ivBytes: 16, ivLabel: 'Initial counter block (16 bytes)', authenticated: false, description: 'Unauthenticated stream mode. The low 64 bits of the 16-byte block are the incrementing counter. Never reuse a counter block with the same key.' },
}

export const GCM_TAG_BYTES = 16

export function parseAesKey(value: string, format: KeyFormat, bits: AesKeyBits): Uint8Array {
  const raw = format === 'utf8' ? utf8Encode(value) : format === 'hex' ? hexToBytes(value) : base64ToBytes(value)
  if (raw.length * 8 !== bits) {
    throw new Error(`AES-${bits} needs a key of exactly ${bits / 8} bytes, but this key is ${raw.length} bytes.`)
  }
  return raw
}

export function generateAesKey(bits: AesKeyBits): Uint8Array {
  return randomBytes(bits / 8)
}

async function importKey(raw: Uint8Array, mode: AesMode, usage: KeyUsage) {
  try {
    return await crypto.subtle.importKey('raw', raw as BufferSource, { name: AES_MODES[mode].name }, false, [usage])
  } catch {
    throw new Error(`This browser does not support AES-${raw.length * 8}-${mode}. Try a different key size or mode — DevCipher will not silently substitute another algorithm.`)
  }
}

const params = (mode: AesMode, iv: Uint8Array) =>
  mode === 'GCM'
    ? { name: 'AES-GCM', iv: iv as BufferSource, tagLength: GCM_TAG_BYTES * 8 }
    : mode === 'CBC'
      ? { name: 'AES-CBC', iv: iv as BufferSource }
      : { name: 'AES-CTR', counter: iv as BufferSource, length: 64 }

export interface AesEncryptResult {
  iv: Uint8Array
  /** Ciphertext (GCM: includes the trailing 16-byte tag). */
  ciphertext: Uint8Array
  /** What the user copies: IV || ciphertext when prependIv, otherwise ciphertext only. */
  output: Uint8Array
}

export async function aesEncrypt(opts: {
  mode: AesMode; key: Uint8Array; plaintext: Uint8Array; iv?: Uint8Array; prependIv: boolean
}): Promise<AesEncryptResult> {
  const { mode, key, plaintext, prependIv } = opts
  const need = AES_MODES[mode].ivBytes
  const iv = opts.iv && opts.iv.length > 0 ? opts.iv : randomBytes(need)
  if (iv.length !== need) throw new Error(`${AES_MODES[mode].ivLabel} must be exactly ${need} bytes; got ${iv.length}.`)
  const k = await importKey(key, mode, 'encrypt')
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(params(mode, iv), k, plaintext as BufferSource))
  if (!prependIv) return { iv, ciphertext, output: ciphertext }
  const output = new Uint8Array(iv.length + ciphertext.length)
  output.set(iv, 0)
  output.set(ciphertext, iv.length)
  return { iv, ciphertext, output }
}

export async function aesDecrypt(opts: {
  mode: AesMode; key: Uint8Array; data: Uint8Array; iv?: Uint8Array; ivPrepended: boolean
}): Promise<Uint8Array> {
  const { mode, key, data } = opts
  const need = AES_MODES[mode].ivBytes
  let iv = opts.iv
  let ct = data
  if (opts.ivPrepended) {
    if (data.length < need) throw new DecryptError('The input is shorter than the IV.')
    iv = data.slice(0, need)
    ct = data.slice(need)
  }
  if (!iv || iv.length !== need) throw new DecryptError(`${AES_MODES[mode].ivLabel} must be exactly ${need} bytes.`)
  if (mode === 'GCM' && ct.length < GCM_TAG_BYTES) throw new DecryptError('Ciphertext is too short to contain the authentication tag.')
  if (mode === 'CBC' && ct.length % 16 !== 0) throw new DecryptError('CBC ciphertext length must be a multiple of 16 bytes.')
  const k = await importKey(key, mode, 'decrypt')
  try {
    return new Uint8Array(await crypto.subtle.decrypt(params(mode, iv), k, ct as BufferSource))
  } catch {
    throw new DecryptError('Unable to decrypt data.')
  }
}

export class DecryptError extends Error {
  hints = ['Incorrect key', 'Incorrect IV / nonce', 'Incorrect encoding (Base64 vs Hex)', 'Invalid or truncated ciphertext', 'Authentication failure (GCM) or invalid padding (CBC)', 'IV prepended setting does not match how the data was encrypted']
}

export const encodeCipher = (b: Uint8Array, f: 'base64' | 'hex') => (f === 'hex' ? bytesToHex(b) : bytesToBase64(b))
export const decodeCipher = (s: string, f: 'base64' | 'hex') => (f === 'hex' ? hexToBytes(s) : base64ToBytes(s))
