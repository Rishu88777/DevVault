/** Pretty-prints / minifies well-formed XML. Validate with DOMParser first (see tools/xml). */
const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/[^>]+>|<[^>]+>|[^<]+/g

export function formatXml(xml: string, indent: string | number = 2, minify = false): string {
  const pad = typeof indent === 'number' ? ' '.repeat(indent) : indent
  const tokens = (xml.match(TOKEN) ?? []).map((t) => (t.startsWith('<') ? t : t.replace(/\s+/g, ' ').trim())).filter((t) => t !== '')
  if (minify) return tokens.join('')
  const lines: string[] = []
  let depth = 0
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const isClose = t.startsWith('</')
    const isOpen = /^<[^!?/][^>]*[^/]>$|^<[^!?/>]>$/.test(t)
    if (isClose) depth = Math.max(0, depth - 1)
    // keep <a>text</a> on one line
    if (isOpen && tokens[i + 1] && !tokens[i + 1].startsWith('<') && tokens[i + 2]?.startsWith('</')) {
      lines.push(pad.repeat(depth) + t + tokens[i + 1] + tokens[i + 2])
      i += 2
      continue
    }
    lines.push(pad.repeat(depth) + t)
    if (isOpen) depth++
  }
  return lines.join('\n')
}
