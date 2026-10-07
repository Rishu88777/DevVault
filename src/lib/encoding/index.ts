import {
  base64ToBytes, base64UrlToBytes, bytesToBase64, bytesToBase64Url, bytesToHex, hexToBytes, utf8Decode, utf8Encode,
} from './bytes'

export * from './bytes'

/* ---------- Base64 ---------- */
export const base64Encode = (s: string) => bytesToBase64(utf8Encode(s))
export const base64Decode = (s: string) => utf8Decode(base64ToBytes(s))
export const base64UrlEncode = (s: string, pad = false) => {
  const r = bytesToBase64Url(utf8Encode(s))
  return pad ? r.padEnd(Math.ceil(r.length / 4) * 4, '=') : r
}
export const base64UrlDecode = (s: string) => utf8Decode(base64UrlToBytes(s))

/* ---------- URL ---------- */
export function urlEncode(s: string, mode: 'component' | 'full' | 'form' = 'component'): string {
  if (mode === 'full') return encodeURI(s)
  const r = encodeURIComponent(s)
  return mode === 'form' ? r.replace(/%20/g, '+') : r
}
export function urlDecode(s: string, plusAsSpace = false): string {
  try {
    return decodeURIComponent(plusAsSpace ? s.replace(/\+/g, ' ') : s)
  } catch {
    throw new Error('Malformed percent-encoding (a % is not followed by two hex digits, or the bytes are not valid UTF-8).')
  }
}

/* ---------- Hex ---------- */
export interface HexOptions { separator: string; upper: boolean; prefix: boolean }
export function hexEncode(s: string, o: HexOptions = { separator: ' ', upper: false, prefix: false }): string {
  const bytes = utf8Encode(s)
  return Array.from(bytes, (b) => (o.prefix ? '0x' : '') + bytesToHex(Uint8Array.of(b), o.upper)).join(o.separator)
}
export const hexDecode = (s: string) => utf8Decode(hexToBytes(s))

/* ---------- Binary ---------- */
export const binaryEncode = (s: string, sep = ' ') =>
  Array.from(utf8Encode(s), (b) => b.toString(2).padStart(8, '0')).join(sep)
export function binaryDecode(s: string): string {
  const clean = s.replace(/[\s,]/g, '').replace(/0b/gi, '')
  if (clean === '') return ''
  if (!/^[01]+$/.test(clean)) throw new Error('Binary input may only contain 0 and 1.')
  if (clean.length % 8 !== 0) throw new Error('Binary input must be a multiple of 8 bits.')
  const out = new Uint8Array(clean.length / 8)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 8, i * 8 + 8), 2)
  return utf8Decode(out)
}

/* ---------- Unicode escapes ---------- */
export type UnicodeStyle = 'u4' | 'braces' | 'uplus'
export function unicodeEncode(s: string, style: UnicodeStyle = 'u4', onlyNonAscii = false): string {
  let out = ''
  for (const ch of s) {
    const cp = ch.codePointAt(0)!
    if (onlyNonAscii && cp < 0x80) { out += ch; continue }
    if (style === 'braces') out += `\\u{${cp.toString(16)}}`
    else if (style === 'uplus') out += `U+${cp.toString(16).toUpperCase().padStart(4, '0')} `
    else if (cp > 0xffff) {
      const v = cp - 0x10000
      out += `\\u${(0xd800 + (v >> 10)).toString(16)}\\u${(0xdc00 + (v & 0x3ff)).toString(16)}`
    } else out += `\\u${cp.toString(16).padStart(4, '0')}`
  }
  return style === 'uplus' ? out.trimEnd() : out
}
export function unicodeDecode(s: string): string {
  return s
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (_, h: string) => {
      const cp = parseInt(h, 16)
      if (cp > 0x10ffff) throw new Error(`Code point U+${h} is out of range.`)
      return String.fromCodePoint(cp)
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/U\+([0-9a-fA-F]{4,6})/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
}

/* ---------- HTML entities ---------- */
const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™', euro: '€',
  pound: '£', yen: '¥', cent: '¢', sect: '§', deg: '°', plusmn: '±', times: '×', divide: '÷', micro: 'µ', para: '¶',
  middot: '·', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•',
  laquo: '«', raquo: '»', larr: '←', rarr: '→', uarr: '↑', darr: '↓', hearts: '♥', infin: '∞', ne: '≠', le: '≤', ge: '≥',
}
const BASIC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function htmlEncode(s: string, nonAscii = false): string {
  let out = s.replace(/[&<>"']/g, (c) => BASIC[c])
  if (nonAscii) out = Array.from(out, (ch) => (ch.codePointAt(0)! > 127 ? `&#x${ch.codePointAt(0)!.toString(16).toUpperCase()};` : ch)).join('')
  return out
}
export function htmlDecode(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, body: string) => {
    if (body[0] === '#') {
      const cp = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m
    }
    return NAMED[body] ?? m
  })
}
