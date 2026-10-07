import { base64ToBytes, bytesToBase64 } from './bytes'

export interface ImageSniff { mime: string; ext: string }

const starts = (b: Uint8Array, sig: number[], off = 0) => sig.every((v, i) => b[off + i] === v)

/** Detects common image formats from magic bytes (never trusts a user-supplied label). */
export function sniffImage(b: Uint8Array): ImageSniff | null {
  if (starts(b, [0x89, 0x50, 0x4e, 0x47])) return { mime: 'image/png', ext: 'png' }
  if (starts(b, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' }
  if (starts(b, [0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif' }
  if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: 'image/webp', ext: 'webp' }
  if (starts(b, [0x42, 0x4d])) return { mime: 'image/bmp', ext: 'bmp' }
  if (starts(b, [0x00, 0x00, 0x01, 0x00])) return { mime: 'image/x-icon', ext: 'ico' }
  const head = new TextDecoder().decode(b.subarray(0, 300)).trimStart().toLowerCase()
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return { mime: 'image/svg+xml', ext: 'svg' }
  return null
}

export interface ParsedImage { bytes: Uint8Array; mime: string; ext: string; dataUri: string }

/** Accepts a data URI (data:image/png;base64,…) or raw Base64 and returns bytes + detected type. */
export function parseBase64Image(input: string): ParsedImage {
  const t = input.trim()
  const m = t.match(/^data:([^;,]*)(;[^,]*)?,([\s\S]*)$/i)
  if (m && !/;base64/i.test(m[2] ?? '')) throw new Error('Only Base64 data URIs are supported (data:image/png;base64,…).')
  const bytes = base64ToBytes(m ? m[3] : t)
  if (bytes.length === 0) throw new Error('Nothing to decode.')
  const sniffed = sniffImage(bytes)
  if (!sniffed) throw new Error('The decoded data is not a recognised image (PNG, JPEG, GIF, WebP, BMP, ICO or SVG).')
  return { bytes, ...sniffed, dataUri: `data:${sniffed.mime};base64,${bytesToBase64(bytes)}` }
}
