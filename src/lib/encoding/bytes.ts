const enc = new TextEncoder()
const dec = new TextDecoder('utf-8', { fatal: true })

export const utf8Encode = (s: string): Uint8Array => enc.encode(s)

export function utf8Decode(b: Uint8Array): string {
  try {
    return dec.decode(b)
  } catch {
    throw new Error('The decoded bytes are not valid UTF-8 text.')
  }
}

export function bytesToHex(b: Uint8Array, upper = false): string {
  let out = ''
  for (const x of b) out += x.toString(16).padStart(2, '0')
  return upper ? out.toUpperCase() : out
}

export function hexToBytes(input: string): Uint8Array {
  const clean = input.replace(/0x/gi, '').replace(/[\s,:\-]/g, '')
  if (clean === '') return new Uint8Array(0)
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('Hex input contains characters other than 0-9 and A-F.')
  if (clean.length % 2 !== 0) throw new Error('Hex input must have an even number of digits.')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function bytesToBase64(b: Uint8Array): string {
  let bin = ''
  const CHUNK = 0x8000
  for (let i = 0; i < b.length; i += CHUNK) bin += String.fromCharCode(...b.subarray(i, i + CHUNK))
  return btoa(bin)
}

export function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, '')
  if (/[-_]/.test(clean) && !/[+/]/.test(clean)) {
    throw new Error('This looks like Base64URL (contains - or _). Use the Base64URL decoder instead.')
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error('Input is not valid Base64 (unexpected characters).')
  const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, '=')
  if (clean.replace(/=+$/, '').length % 4 === 1) throw new Error('Input is not valid Base64 (incorrect length).')
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export const bytesToBase64Url = (b: Uint8Array) =>
  bytesToBase64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function base64UrlToBytes(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, '')
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(clean)) throw new Error('Input is not valid Base64URL (unexpected characters).')
  const std = clean.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/')
  return base64ToBytes(std)
}

export type BinaryFormat = 'utf8' | 'hex' | 'base64'
export const BINARY_FORMAT_LABELS: Record<BinaryFormat, string> = { utf8: 'Text (UTF-8)', hex: 'Hex', base64: 'Base64' }

export function parseBytes(value: string, format: BinaryFormat): Uint8Array {
  if (format === 'hex') return hexToBytes(value)
  if (format === 'base64') return base64ToBytes(value)
  return utf8Encode(value)
}

export function formatBytes(b: Uint8Array, format: 'hex' | 'base64' | 'base64url'): string {
  if (format === 'hex') return bytesToHex(b)
  if (format === 'base64url') return bytesToBase64Url(b)
  return bytesToBase64(b)
}
