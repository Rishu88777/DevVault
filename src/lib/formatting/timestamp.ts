export type TsUnit = 's' | 'ms'

/** Heuristic: |n| >= 1e11 is treated as milliseconds (year 5138 in seconds / 1973 in ms). */
export const guessUnit = (n: number): TsUnit => (Math.abs(n) >= 1e11 ? 'ms' : 's')

export function relativeTime(ms: number, now = Date.now()): string {
  const diff = ms - now
  const abs = Math.abs(diff)
  const units: [number, string][] = [[31536e6, 'year'], [2592e6, 'month'], [864e5, 'day'], [36e5, 'hour'], [6e4, 'minute'], [1e3, 'second']]
  for (const [size, name] of units) {
    if (abs >= size) {
      const n = Math.round(abs / size)
      return diff < 0 ? `${n} ${name}${n > 1 ? 's' : ''} ago` : `in ${n} ${name}${n > 1 ? 's' : ''}`
    }
  }
  return 'just now'
}

export function describeTimestamp(value: string, unit: TsUnit | 'auto', now = Date.now()) {
  if (!/^-?\d+(\.\d+)?$/.test(value.trim())) throw new Error('Enter a numeric Unix timestamp.')
  const n = Number(value)
  const u = unit === 'auto' ? guessUnit(n) : unit
  const ms = u === 's' ? n * 1000 : n
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) throw new Error('That timestamp is outside the representable date range.')
  return { unit: u, ms, iso: d.toISOString(), utc: d.toUTCString(), local: d.toString(), seconds: Math.floor(ms / 1000), relative: relativeTime(ms, now) }
}
