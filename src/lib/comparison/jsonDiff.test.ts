import { describe, expect, it } from 'vitest'
import { diffJson, summarizeDiff } from './jsonDiff'
import { describeJsonError, parseJson, runJsonJob, tokenizeJson } from '../formatting/json'

describe('diffJson', () => {
  it('finds changed, added and removed properties', () => {
    const d = diffJson({ name: 'John', age: 3, x: 1 }, { name: 'Rishu', age: 3, y: 2 })
    expect(d).toEqual([
      { path: 'name', type: 'changed', left: 'John', right: 'Rishu' },
      { path: 'x', type: 'removed', left: 1 },
      { path: 'y', type: 'added', right: 2 },
    ])
  })
  it('reports nested and array differences with paths', () => {
    const d = diffJson({ a: { b: [1, 2, { c: 1 }] } }, { a: { b: [1, 3, { c: 2 }, 9] } })
    expect(d.map((x) => `${x.type}:${x.path}`)).toEqual(['changed:a.b[1]', 'changed:a.b[2].c', 'added:a.b[3]'])
  })
  it('detects type changes', () => {
    expect(diffJson({ a: 1 }, { a: '1' })[0].type).toBe('changed')
    expect(diffJson({ a: null }, { a: {} })[0].type).toBe('changed')
  })
  it('ignores key order by default and can report it', () => {
    expect(diffJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([])
    expect(diffJson({ a: 1, b: 2 }, { b: 2, a: 1 }, { ignoreKeyOrder: false })[0].type).toBe('reordered')
  })
  it('ignores array order', () => {
    expect(diffJson([1, 2, 3], [3, 1, 2], { ignoreArrayOrder: true })).toEqual([])
    const d = diffJson([1, 2, 3], [3, 1, 4], { ignoreArrayOrder: true })
    expect(summarizeDiff(d)).toMatchObject({ added: 1, removed: 1 })
  })
  it('ignores string whitespace and selected fields', () => {
    expect(diffJson({ a: ' hi   there ' }, { a: 'hi there' }, { ignoreStringWhitespace: true })).toEqual([])
    expect(diffJson({ id: 1, u: { id: 2, n: 1 } }, { id: 9, u: { id: 8, n: 1 } }, { ignoredFields: ['id'] })).toEqual([])
    expect(diffJson({ u: { id: 2, n: 1 } }, { u: { id: 8, n: 2 } }, { ignoredFields: ['u.id'] })).toHaveLength(1)
  })
  it('identical documents produce no diff', () => expect(diffJson({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toEqual([]))
})

describe('JSON formatting', () => {
  it('pretty prints, minifies and sorts', () => {
    expect(runJsonJob({ op: 'format', text: '{"b":1,"a":[1,2]}', indent: 2, sortKeys: false })).toEqual({ ok: true, output: '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}' })
    expect(runJsonJob({ op: 'minify', text: '{ "a" : 1 }', indent: 2, sortKeys: false })).toEqual({ ok: true, output: '{"a":1}' })
    expect(runJsonJob({ op: 'format', text: '{"b":1,"a":2}', indent: 'tab', sortKeys: true })).toEqual({ ok: true, output: '{\n\t"a": 2,\n\t"b": 1\n}' })
  })
  it('reports line and column for invalid JSON', () => {
    const text = '{\n  "a": 1,\n  "b": ,\n}'
    const r = parseJson(text)
    expect(r.ok).toBe(false)
    if (!r.ok) { expect(r.error.line).toBe(3); expect(r.error.column).toBe(8); expect(r.error.message).toMatch(/Unexpected token ','/) }
    const e = describeJsonError('{"a":', new SyntaxError('Unexpected end of JSON input'))
    expect(e.line).toBe(1)
  })
  it('tokenizes for highlighting without losing text', () => {
    const t = '{"a": [1, true, null, "x"]}'
    const tokens = tokenizeJson(t)
    expect(tokens.map((x) => x.text).join('')).toBe(t)
    expect(tokens[1].kind).toBe('key')
  })
})
