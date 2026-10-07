const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export function parseBase(input: string, base: number): bigint {
  if (base < 2 || base > 36) throw new Error('Base must be between 2 and 36.')
  let s = input.trim().toLowerCase().replace(/[_\s]/g, '')
  let neg = false
  if (s.startsWith('-')) { neg = true; s = s.slice(1) }
  if (base === 16) s = s.replace(/^0x/, '')
  if (base === 2) s = s.replace(/^0b/, '')
  if (base === 8) s = s.replace(/^0o/, '')
  if (s === '') throw new Error('Enter a number.')
  let v = 0n
  const b = BigInt(base)
  for (const ch of s) {
    const d = DIGITS.indexOf(ch)
    if (d < 0 || d >= base) throw new Error(`"${ch}" is not a valid base-${base} digit.`)
    v = v * b + BigInt(d)
  }
  return neg ? -v : v
}
export const toBase = (v: bigint, base: number) => v.toString(base)
