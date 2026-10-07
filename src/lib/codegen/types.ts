/** Language-agnostic type tree inferred from a JSON sample. Generators consume this, so adding a language = one file. */
export type TypeNode =
  | { kind: 'string' | 'int' | 'float' | 'bool' | 'null' | 'any' }
  | { kind: 'array'; item: TypeNode }
  | { kind: 'object'; name: string; fields: { key: string; type: TypeNode; optional: boolean }[] }

export function inferType(value: unknown, name: string): TypeNode {
  if (value === null) return { kind: 'null' }
  if (typeof value === 'string') return { kind: 'string' }
  if (typeof value === 'boolean') return { kind: 'bool' }
  if (typeof value === 'number') return { kind: Number.isInteger(value) ? 'int' : 'float' }
  if (Array.isArray(value)) {
    const items = value.map((v) => inferType(v, singular(name)))
    return { kind: 'array', item: items.length ? items.reduce(mergeTypes) : { kind: 'any' } }
  }
  if (typeof value === 'object') {
    return { kind: 'object', name, fields: Object.entries(value as object).map(([key, v]) => ({ key, type: inferType(v, pascal(key)), optional: false })) }
  }
  return { kind: 'any' }
}

export function mergeTypes(a: TypeNode, b: TypeNode): TypeNode {
  if (a.kind === 'object' && b.kind === 'object') {
    const keys = [...new Set([...a.fields.map((f) => f.key), ...b.fields.map((f) => f.key)])]
    return {
      kind: 'object', name: a.name,
      fields: keys.map((key) => {
        const fa = a.fields.find((f) => f.key === key), fb = b.fields.find((f) => f.key === key)
        return { key, type: fa && fb ? mergeTypes(fa.type, fb.type) : (fa ?? fb)!.type, optional: !fa || !fb || fa.optional || fb.optional }
      }),
    }
  }
  if (a.kind === 'array' && b.kind === 'array') return { kind: 'array', item: mergeTypes(a.item, b.item) }
  if (a.kind === b.kind) return a
  if ((a.kind === 'int' && b.kind === 'float') || (a.kind === 'float' && b.kind === 'int')) return { kind: 'float' }
  if (a.kind === 'null') return b
  if (b.kind === 'null') return a
  return { kind: 'any' }
}

export const pascal = (s: string) => {
  const r = s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ?? '').toUpperCase()).replace(/^(.)/, (c) => c.toUpperCase())
  return /^[A-Za-z_]/.test(r) ? r : `_${r}`
}
export const camel = (s: string) => pascal(s).replace(/^(.)/, (c) => c.toLowerCase())
export const snake = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9]+/g, '_').toLowerCase().replace(/^(\d)/, '_$1')
const singular = (s: string) => (/ies$/.test(s) ? s.slice(0, -3) + 'y' : /s$/.test(s) && s.length > 1 ? s.slice(0, -1) : s + 'Item')

/** Collect every named object type (depth-first, de-duplicated by name). */
export function collectObjects(t: TypeNode, acc: Extract<TypeNode, { kind: 'object' }>[] = []) {
  if (t.kind === 'array') collectObjects(t.item, acc)
  if (t.kind === 'object') {
    for (const f of t.fields) collectObjects(f.type, acc)
    if (!acc.some((o) => o.name === t.name)) acc.push(t)
  }
  return acc
}
