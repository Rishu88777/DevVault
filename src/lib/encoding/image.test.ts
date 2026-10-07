import { describe, expect, it } from 'vitest'
import { parseBase64Image, sniffImage } from './image'

const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
describe('image base64', () => {
  it('detects PNG from raw base64 and from a data URI', () => {
    expect(parseBase64Image(PNG_1PX)).toMatchObject({ mime: 'image/png', ext: 'png' })
    const p = parseBase64Image(`data:image/jpeg;base64,${PNG_1PX}`)
    expect(p.mime).toBe('image/png') // trusts bytes, not the label
    expect(p.dataUri.startsWith('data:image/png;base64,')).toBe(true)
  })
  it('detects svg and rejects non-images', () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))?.ext).toBe('svg')
    expect(() => parseBase64Image(btoa('hello world'))).toThrow(/not a recognised image/)
    expect(() => parseBase64Image('@@')).toThrow()
    expect(() => parseBase64Image('data:image/png,abc')).toThrow(/Base64 data URIs/)
  })
})
