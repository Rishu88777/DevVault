import { DEFAULT_DIFF_OPTIONS, type DiffOptions } from './jsonDiff'

export type LineKind = 'same' | 'added' | 'removed' | 'changed' | 'empty'
export interface Cell { text: string; kind: LineKind }
export interface Change { type: 'added' | 'removed' | 'changed'; path: string; message: string }
/** `change` is set on the first row of every difference, for navigation. */
export interface Row { left: Cell; right: Cell; change?: Change }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const EMPTY: Cell = { text: '', kind: 'empty' }
const IDENT = /^[A-Za-z_$][\w$]*$/

/** Pretty-print `v` into lines (2-space indent) — the first line is prefixed with `label`, the last gets `comma`. */
function lines(v: unknown, label: string, comma: string, depth: number, o: DiffOptions, ignored: Set<string>, path: string): string[] {
  const pad = '  '.repeat(depth)
  const head = pad + label
  if (Array.isArray(v)) {
    if (v.length === 0) return [`${head}[]${comma}`]
    const items = sortedArray(v, o)
    return [`${head}[`, ...items.flatMap((x, i) => lines(x, '', i < items.length - 1 ? ',' : '', depth + 1, o, ignored, `${path}[${i}]`)), `${pad}]${comma}`]
  }
  if (isObj(v)) {
    const keys = Object.keys(v).filter((k) => !skip(ignored, path, k))
    if (keys.length === 0) return [`${head}{}${comma}`]
    return [`${head}{`, ...keys.flatMap((k, i) => lines(v[k], `${JSON.stringify(k)}: `, i < keys.length - 1 ? ',' : '', depth + 1, o, ignored, join(path, k))), `${pad}}${comma}`]
  }
  return [`${head}${JSON.stringify(v)}${comma}`]
}
const join = (p: string, k: string) => (p === '' ? (IDENT.test(k) ? k : `["${k}"]`) : IDENT.test(k) ? `${p}.${k}` : `${p}["${k}"]`)
const skip = (ignored: Set<string>, path: string, key: string) => ignored.has(key) || ignored.has(join(path, key))
const canon = (v: unknown, o: DiffOptions): string => (typeof v === 'string' ? JSON.stringify(o.ignoreStringWhitespace ? v.trim().replace(/\s+/g, ' ') : v) : Array.isArray(v) ? `[${(o.ignoreArrayOrder ? v.map((x) => canon(x, o)).sort() : v.map((x) => canon(x, o))).join(',')}]` : isObj(v) ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k], o)}`).join(',')}}` : JSON.stringify(v))
const sortedArray = (a: unknown[], o: DiffOptions) => (o.ignoreArrayOrder ? [...a].sort((x, y) => (canon(x, o) < canon(y, o) ? -1 : 1)) : a)

const block = (ls: string[], kind: LineKind): Cell[] => ls.map((text) => ({ text, kind }))
const pair = (l: Cell[], r: Cell[]): Row[] => {
  const n = Math.max(l.length, r.length)
  return Array.from({ length: n }, (_, i) => ({ left: l[i] ?? EMPTY, right: r[i] ?? EMPTY }))
}

/**
 * Builds aligned left/right rows: unchanged lines are plain, removed lines are red on the left
 * (blank on the right), added lines are green on the right, changed values are amber on both sides.
 */
export function buildSideBySide(a: unknown, b: unknown, options: Partial<DiffOptions> = {}): { rows: Row[]; changes: number } {
  const o = { ...DEFAULT_DIFF_OPTIONS, ...options }
  const ignored = new Set(o.ignoredFields.map((s) => s.trim()).filter(Boolean))
  let changes = 0
  const tag = (rows: Row[], change: Change) => { if (rows[0]) rows[0].change = change; return rows }
  const show = (v: unknown) => { const t = JSON.stringify(v); return t.length > 40 ? t.slice(0, 40) + '…' : t }
  const where = (p: string) => (p === '' ? 'root' : p)

  const walk = (x: unknown, y: unknown, label: string, comma: string, depth: number, path: string): Row[] => {
    const pad = '  '.repeat(depth)
    if (isObj(x) && isObj(y)) {
      const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => !skip(ignored, path, k))
      if (keys.length === 0) return pair(block([`${pad}${label}{}${comma}`], 'same'), block([`${pad}${label}{}${comma}`], 'same'))
      const rows: Row[] = pair(block([`${pad}${label}{`], 'same'), block([`${pad}${label}{`], 'same'))
      keys.forEach((k, i) => {
        const c = i < keys.length - 1 ? ',' : ''
        const lab = `${JSON.stringify(k)}: `, p = join(path, k)
        if (k in x && k in y) rows.push(...walk(x[k], y[k], lab, c, depth + 1, p))
        else if (k in x) { changes++; rows.push(...tag(pair(block(lines(x[k], lab, c, depth + 1, o, ignored, p), 'removed'), []), { type: 'removed', path: p, message: `Missing property “${k}” from the object on the right side` })) }
        else { changes++; rows.push(...tag(pair([], block(lines(y[k], lab, c, depth + 1, o, ignored, p), 'added')), { type: 'added', path: p, message: `Missing property “${k}” from the object on the left side` })) }
      })
      rows.push(...pair(block([`${pad}}${comma}`], 'same'), block([`${pad}}${comma}`], 'same')))
      return rows
    }
    if (Array.isArray(x) && Array.isArray(y)) {
      const xs = sortedArray(x, o), ys = sortedArray(y, o)
      const n = Math.max(xs.length, ys.length)
      if (n === 0) return pair(block([`${pad}${label}[]${comma}`], 'same'), block([`${pad}${label}[]${comma}`], 'same'))
      const rows: Row[] = pair(block([`${pad}${label}[`], 'same'), block([`${pad}${label}[`], 'same'))
      for (let i = 0; i < n; i++) {
        const p = `${path}[${i}]`
        const lc = i < xs.length - 1 ? ',' : '', rc = i < ys.length - 1 ? ',' : '', c = i < n - 1 ? ',' : ''
        if (i < xs.length && i < ys.length) rows.push(...walk(xs[i], ys[i], '', c, depth + 1, p))
        else if (i < xs.length) { changes++; rows.push(...tag(pair(block(lines(xs[i], '', lc, depth + 1, o, ignored, p), 'removed'), []), { type: 'removed', path: p, message: `Array item ${i} is missing from the right side` })) }
        else { changes++; rows.push(...tag(pair([], block(lines(ys[i], '', rc, depth + 1, o, ignored, p), 'added')), { type: 'added', path: p, message: `Array item ${i} is missing from the left side` })) }
      }
      rows.push(...pair(block([`${pad}]${comma}`], 'same'), block([`${pad}]${comma}`], 'same')))
      return rows
    }
    // primitives or mismatched types
    if (canon(x, o) === canon(y, o)) return pair(block(lines(x, label, comma, depth, o, ignored, path), 'same'), block(lines(y, label, comma, depth, o, ignored, path), 'same'))
    changes++
    return tag(pair(block(lines(x, label, comma, depth, o, ignored, path), 'changed'), block(lines(y, label, comma, depth, o, ignored, path), 'changed')), { type: 'changed', path, message: `Value at ${where(path)} changed from ${show(x)} to ${show(y)}` })
  }
  return { rows: walk(a, b, '', '', 0, ''), changes }
}
