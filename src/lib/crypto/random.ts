/** All randomness in DevCipher comes from crypto.getRandomValues — never Math.random. */
export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(n, i + 65536)))
  return out
}

/** Unbiased random integer in [0, max) using rejection sampling. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError('max must be an integer in 1..2^32')
  const limit = Math.floor(2 ** 32 / max) * max
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % max
  }
}

export function randomString(charset: string, length: number): string {
  const chars = Array.from(charset)
  if (chars.length === 0) throw new Error('Character set is empty.')
  let out = ''
  for (let i = 0; i < length; i++) out += chars[randomInt(chars.length)]
  return out
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ---------- UUID ---------- */
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const fmtUuid = (b: Uint8Array) => {
  const h = hex(b)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function uuidV4(): string {
  const b = randomBytes(16)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  return fmtUuid(b)
}

let lastV7 = 0
/** RFC 9562 UUIDv7: 48-bit unix-ms timestamp + 74 random bits. Timestamps are forced to be strictly increasing. */
export function uuidV7(now: number = Date.now()): string {
  const ts = Math.max(now, lastV7 + 1)
  lastV7 = ts
  const b = randomBytes(16)
  let t = ts
  for (let i = 5; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256) }
  b[6] = (b[6] & 0x0f) | 0x70
  b[8] = (b[8] & 0x3f) | 0x80
  return fmtUuid(b)
}

/* ---------- Password ---------- */
export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}
const AMBIGUOUS = /[Il1O0o|`'"]/g
export function passwordPools(o: PasswordOptions): string[] {
  const strip = (s: string) => (o.excludeAmbiguous ? s.replace(AMBIGUOUS, '') : s)
  const pools: string[] = []
  if (o.uppercase) pools.push(strip('ABCDEFGHIJKLMNOPQRSTUVWXYZ'))
  if (o.lowercase) pools.push(strip('abcdefghijklmnopqrstuvwxyz'))
  if (o.numbers) pools.push(strip('0123456789'))
  if (o.symbols) pools.push(strip('!@#$%^&*()-_=+[]{};:,.<>/?~'))
  return pools
}
export function generatePassword(o: PasswordOptions): string {
  const pools = passwordPools(o)
  if (pools.length === 0) throw new Error('Select at least one character type.')
  if (o.length < pools.length) throw new Error(`Length must be at least ${pools.length} to include every selected type.`)
  if (o.length > 4096) throw new Error('Length is limited to 4096.')
  const all = pools.join('')
  const chars = pools.map((p) => p[randomInt(p.length)])
  while (chars.length < o.length) chars.push(all[randomInt(all.length)])
  return shuffle(chars).join('')
}
export function passwordEntropyBits(o: PasswordOptions): number {
  const size = passwordPools(o).join('').length
  return size > 0 ? Math.round(o.length * Math.log2(size)) : 0
}
