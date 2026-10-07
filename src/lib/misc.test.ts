import { describe, expect, it } from 'vitest'
import { csvToJson, jsonToCsv, parseCsv } from './formatting/csv'
import { formatXml } from './formatting/xml'
import { hslToRgb, parseColor, rgbToHex, rgbToHsl, parseHex, contrastRatio } from './formatting/color'
import { parseBase, toBase } from './formatting/numbers'
import { describeTimestamp, guessUnit } from './formatting/timestamp'
import { fuzzyScore, rank } from './search'
import { parseQuery, parseUrl } from './url'
import { generateCode } from './codegen'

describe('csv', () => {
  it('parses quotes, escaped quotes and newlines', () => {
    expect(parseCsv('a,"b,c","d ""q"""\n1,2,"x\ny"')).toEqual([['a', 'b,c', 'd "q"'], ['1', '2', 'x\ny']])
  })
  it('csv <-> json round trip', () => {
    const json = csvToJson('name,age\nAda,36\n"Smith, J",x', { delimiter: ',', header: true, infer: true })
    expect(json).toEqual([{ name: 'Ada', age: 36 }, { name: 'Smith, J', age: 'x' }])
    expect(jsonToCsv(json)).toBe('name,age\nAda,36\n"Smith, J",x')
  })
  it('errors cleanly', () => {
    expect(() => parseCsv('a,"b')).toThrow(/Unterminated/)
    expect(() => jsonToCsv({})).toThrow(/array/)
  })
})

describe('xml', () => {
  it('pretty prints and minifies', () => {
    const x = '<a><b>1</b><c><d/></c></a>'
    expect(formatXml(x, 2)).toBe('<a>\n  <b>1</b>\n  <c>\n    <d/>\n  </c>\n</a>')
    expect(formatXml(formatXml(x), 2, true)).toBe(x)
  })
})

describe('color / numbers / time', () => {
  it('converts colours', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHex(hslToRgb({ h: 120, s: 100, l: 50 }))).toBe('#00ff00')
    expect(rgbToHex(parseColor('rgb(10, 20, 30)'))).toBe('#0a141e')
    expect(rgbToHex(parseColor('hsl(240, 100%, 50%)'))).toBe('#0000ff')
    expect(() => parseHex('zzz')).toThrow()
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 0)
  })
  it('converts bases with BigInt precision', () => {
    expect(parseBase('ff', 16)).toBe(255n)
    expect(toBase(255n, 2)).toBe('11111111')
    expect(toBase(parseBase('18446744073709551616', 10), 16)).toBe('10000000000000000')
    expect(() => parseBase('12', 2)).toThrow(/not a valid/)
  })
  it('describes timestamps', () => {
    expect(guessUnit(1700000000)).toBe('s')
    expect(guessUnit(1700000000000)).toBe('ms')
    expect(describeTimestamp('1700000000', 'auto', 1700000060000)).toMatchObject({ iso: '2023-11-14T22:13:20.000Z', relative: '1 minute ago' })
    expect(() => describeTimestamp('abc', 'auto')).toThrow()
  })
})

describe('search & url', () => {
  it('fuzzy ranks exact > prefix > substring > subsequence', () => {
    expect(fuzzyScore('json', 'JSON Formatter')).toBeGreaterThan(fuzzyScore('jsf', 'JSON Formatter'))
    expect(fuzzyScore('xyz', 'JSON')).toBe(0)
    const r = rank(['Base64 Encoder', 'JSON Formatter'], 'b64', (s) => [{ text: s, weight: 1 }])
    expect(r).toEqual(['Base64 Encoder'])
  })
  it('parses urls and queries', () => {
    const u = parseUrl('https://u:p@example.com:8080/a/b?page=2&sort=name#top')
    expect(u).toMatchObject({ protocol: 'https:', username: 'u', password: 'p', port: '8080', pathname: '/a/b', hash: '#top' })
    expect(u.params).toEqual([['page', '2'], ['sort', 'name']])
    expect(parseQuery('?a=1&a=2&b=%20x')).toEqual([['a', '1'], ['a', '2'], ['b', ' x']])
    expect(() => parseUrl('not a url')).toThrow()
  })
})

describe('codegen', () => {
  const sample = { id: 1, name: 'a', tags: ['x'], owner: { email: 'e', score: 1.5 }, items: [{ a: 1 }, { a: 2, b: true }] }
  it('generates TypeScript interfaces with optional merged fields', () => {
    const out = generateCode(sample, 'typescript')
    expect(out).toContain('export interface Root {')
    expect(out).toContain('tags: string[];')
    expect(out).toContain('owner: Owner;')
    expect(out).toContain('b?: boolean;')
  })
  it('every registered language produces output', () => {
    for (const id of ['typescript', 'javascript', 'python', 'go', 'java', 'csharp']) expect(generateCode(sample, id).length).toBeGreaterThan(20)
    expect(generateCode(sample, 'go')).toContain('Name string `json:"name"`')
  })
})
