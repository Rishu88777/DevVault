export type DiffType = 'added' | 'removed' | 'changed' | 'reordered'
export interface DiffEntry { path: string; type: DiffType; left?: unknown; right?: unknown }

export interface DiffOptions {
  /** Object key order is not a difference (default true). When false, differing key order is reported. */
  ignoreKeyOrder: boolean
  ignoreArrayOrder: boolean
  /** Trim and collapse whitespace inside string values before comparing. */
  ignoreStringWhitespace: boolean
  /** Key names ("id") or full paths ("user.tags[0].id") to skip. */
  ignoredFields: string[]
}
export const DEFAULT_DIFF_OPTIONS: DiffOptions = { ignoreKeyOrder: true, ignoreArrayOrder: false, ignoreStringWhitespace: false, ignoredFields: [] }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const kind = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)
const joinKey = (p: string, k: string) => (p === '' ? (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `["${k}"]`) : /^[A-Za-z_$][\w$]*$/.test(k) ? `${p}.${k}` : `${p}["${k}"]`)

function canonical(v: unknown, o: DiffOptions): string {
  if (typeof v === 'string') return JSON.stringify(o.ignoreStringWhitespace ? v.trim().replace(/\s+/g, ' ') : v)
  if (Array.isArray(v)) {
    const items = v.map((x) => canonical(x, o))
    return `[${(o.ignoreArrayOrder ? items.sort() : items).join(',')}]`
  }
  if (isObj(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k], o)}`).join(',')}}`
  return JSON.stringify(v)
}

export function diffJson(a: unknown, b: unknown, options: Partial<DiffOptions> = {}): DiffEntry[] {
  const o = { ...DEFAULT_DIFF_OPTIONS, ...options }
  const ignored = new Set(o.ignoredFields.map((s) => s.trim()).filter(Boolean))
  const out: DiffEntry[] = []
  const skip = (path: string, key: string) => ignored.has(path) || ignored.has(key)

  const walk = (x: unknown, y: unknown, path: string) => {
    const label = path === '' ? '$' : path
    if (isObj(x) && isObj(y)) {
      const kx = Object.keys(x), ky = Object.keys(y)
      const keys = new Set([...kx, ...ky])
      for (const k of keys) {
        const p = joinKey(path, k)
        if (skip(p, k)) continue
        if (!(k in y)) out.push({ path: p, type: 'removed', left: x[k] })
        else if (!(k in x)) out.push({ path: p, type: 'added', right: y[k] })
        else walk(x[k], y[k], p)
      }
      if (!o.ignoreKeyOrder) {
        const cx = kx.filter((k) => k in y && !skip(joinKey(path, k), k)), cy = ky.filter((k) => k in x && !skip(joinKey(path, k), k))
        if (cx.join('\u0000') !== cy.join('\u0000')) out.push({ path: label, type: 'reordered', left: cx, right: cy })
      }
    } else if (Array.isArray(x) && Array.isArray(y)) {
      if (o.ignoreArrayOrder) {
        const remaining = new Map<string, number>()
        for (const v of y) remaining.set(canonical(v, o), (remaining.get(canonical(v, o)) ?? 0) + 1)
        const unmatchedX: unknown[] = []
        for (const v of x) {
          const c = canonical(v, o)
          const n = remaining.get(c) ?? 0
          if (n > 0) remaining.set(c, n - 1)
          else unmatchedX.push(v)
        }
        const unmatchedY: unknown[] = []
        for (const v of y) {
          const c = canonical(v, o)
          const n = remaining.get(c) ?? 0
          if (n > 0) { unmatchedY.push(v); remaining.set(c, n - 1) }
        }
        unmatchedX.forEach((v) => out.push({ path: `${label}[*]`, type: 'removed', left: v }))
        unmatchedY.forEach((v) => out.push({ path: `${label}[*]`, type: 'added', right: v }))
      } else {
        const n = Math.max(x.length, y.length)
        for (let i = 0; i < n; i++) {
          const p = `${path}[${i}]`
          if (i >= y.length) out.push({ path: p, type: 'removed', left: x[i] })
          else if (i >= x.length) out.push({ path: p, type: 'added', right: y[i] })
          else walk(x[i], y[i], p)
        }
      }
    } else if (kind(x) === 'string' && kind(y) === 'string' && o.ignoreStringWhitespace) {
      if (canonical(x, o) !== canonical(y, o)) out.push({ path: label, type: 'changed', left: x, right: y })
    } else if (!Object.is(x, y) && !(x === y)) {
      out.push({ path: label, type: 'changed', left: x, right: y })
    }
  }
  walk(a, b, '')
  return out
}

export const summarizeDiff = (d: DiffEntry[]) => ({
  added: d.filter((x) => x.type === 'added').length,
  removed: d.filter((x) => x.type === 'removed').length,
  changed: d.filter((x) => x.type === 'changed').length,
  reordered: d.filter((x) => x.type === 'reordered').length,
})
