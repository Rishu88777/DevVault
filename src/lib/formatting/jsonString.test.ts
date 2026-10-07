import { describe, expect, it } from 'vitest'
import { jsonToString, stringToJson } from './jsonString'

describe('JSON <-> string', () => {
  it('escapes JSON into a string literal and back', () => {
    const s = jsonToString('{ "a": [1, "x"] }')
    expect(s).toBe('"{\\"a\\":[1,\\"x\\"]}"')
    expect(JSON.parse(stringToJson(s))).toEqual({ a: [1, 'x'] })
  })
  it('accepts unquoted escaped JSON, double-encoded strings and plain JSON', () => {
    expect(JSON.parse(stringToJson('{\\"a\\":1}'))).toEqual({ a: 1 })
    expect(JSON.parse(stringToJson(JSON.stringify(JSON.stringify('{"a":1}'))))).toEqual({ a: 1 })
    expect(JSON.parse(stringToJson('{"a":1}'))).toEqual({ a: 1 })
  })
  it('errors on junk', () => {
    expect(() => stringToJson('hello world')).toThrow()
    expect(() => jsonToString('nope')).toThrow(/not valid JSON/)
  })
})
