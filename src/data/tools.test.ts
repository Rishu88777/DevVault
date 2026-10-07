import { describe, expect, it } from 'vitest'
import { TOOLS, toolDescription, toolFaq, toolTitle, visibleTools } from './tools'

describe('tool registry', () => {
  it('has unique ids and paths', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length)
    expect(new Set(TOOLS.map((t) => t.path)).size).toBe(TOOLS.length)
  })
  it('every tool has SEO-friendly metadata', () => {
    for (const t of TOOLS) {
      expect(t.keywords.length, t.id).toBeGreaterThanOrEqual(3)
      expect(t.howItWorks.body.length, t.id).toBeGreaterThan(0)
      expect(toolTitle(t).length, `${t.id} title: ${toolTitle(t)}`).toBeLessThanOrEqual(75)
      expect(toolDescription(t).length, `${t.id} description`).toBeLessThanOrEqual(175)
      expect(toolFaq(t)).toHaveLength(3)
    }
  })
  it('keyword landing pages exist and are hidden from menus', () => {
    for (const id of ['string-to-json', 'json-validator', 'json-minifier', 'json-diff', 'image-to-base64', 'base64-to-image']) expect(TOOLS.find((t) => t.id === id), id).toBeTruthy()
    expect(visibleTools().some((t) => t.id === 'string-to-json')).toBe(false)
  })
})
