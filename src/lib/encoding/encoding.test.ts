import { describe, expect, it } from 'vitest'
import {
  base64Decode, base64Encode, base64UrlDecode, base64UrlEncode, binaryDecode, binaryEncode, hexDecode, hexEncode,
  htmlDecode, htmlEncode, unicodeDecode, unicodeEncode, urlDecode, urlEncode, hexToBytes, base64ToBytes,
} from './index'

describe('base64', () => {
  it('encodes known vectors', () => {
    expect(base64Encode('')).toBe('')
    expect(base64Encode('f')).toBe('Zg==')
    expect(base64Encode('foobar')).toBe('Zm9vYmFy')
  })
  it('round-trips unicode', () => {
    const s = 'héllo 世界 🔐'
    expect(base64Decode(base64Encode(s))).toBe(s)
  })
  it('accepts missing padding and whitespace', () => {
    expect(base64Decode('Zm9v\nYg')).toBe('foob')
  })
  it('rejects invalid input', () => {
    expect(() => base64Decode('@@@')).toThrow(/not valid Base64/)
    expect(() => base64Decode('abcde')).toThrow()
    expect(() => base64ToBytes('ab-_')).toThrow(/Base64URL/)
  })
  it('base64url is URL-safe and unpadded', () => {
    const enc = base64UrlEncode('??>>subjects?')
    expect(enc).not.toMatch(/[+/=]/)
    expect(base64UrlDecode(enc)).toBe('??>>subjects?')
  })
})

describe('url', () => {
  it('encodes and decodes', () => {
    expect(urlEncode('a b&c=d/é')).toBe('a%20b%26c%3Dd%2F%C3%A9')
    expect(urlEncode('a b', 'form')).toBe('a+b')
    expect(urlEncode('http://x.com/a b', 'full')).toBe('http://x.com/a%20b')
    expect(urlDecode('a%20b%26c')).toBe('a b&c')
    expect(urlDecode('a+b', true)).toBe('a b')
  })
  it('throws friendly error on malformed input', () => {
    expect(() => urlDecode('%E0%A4%A')).toThrow(/Malformed/)
  })
})

describe('hex / binary / unicode / html', () => {
  it('hex round trip', () => {
    expect(hexEncode('Hi')).toBe('48 69')
    expect(hexDecode('48 69')).toBe('Hi')
    expect(hexDecode('0x48,0x69')).toBe('Hi')
    expect(() => hexToBytes('abc')).toThrow(/even/)
    expect(() => hexToBytes('zz')).toThrow()
  })
  it('binary round trip', () => {
    expect(binaryEncode('A')).toBe('01000001')
    expect(binaryDecode('01001000 01101001')).toBe('Hi')
    expect(() => binaryDecode('0101')).toThrow()
  })
  it('unicode escapes', () => {
    expect(unicodeEncode('é', 'u4')).toBe('\\u00e9')
    expect(unicodeEncode('😀', 'u4')).toBe('\\ud83d\\ude00')
    expect(unicodeDecode('\\ud83d\\ude00 \\u{1f600} U+0041')).toBe('😀 😀 A')
    expect(unicodeEncode('aé', 'u4', true)).toBe('a\\u00e9')
  })
  it('html entities', () => {
    expect(htmlEncode('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
    expect(htmlDecode('&lt;b&gt; &amp; &#65; &#x42; &copy; &unknown;')).toBe('<b> & A B © &unknown;')
    expect(htmlDecode(htmlEncode('x < y && "z"'))).toBe('x < y && "z"')
  })
})
