export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = '', inQ = false, i = 0
  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { pushField(); rows.push(row); row = [] }
  while (i < text.length) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQ = false
      } else field += c
    } else if (c === '"' && field === '') inQ = true
    else if (c === delimiter) pushField()
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      pushRow()
    } else field += c
    i++
  }
  if (inQ) throw new Error('Unterminated quoted field — a " was opened but never closed.')
  if (field !== '' || row.length > 0) pushRow()
  return rows
}

const parseScalar = (v: string): unknown => {
  if (v === '') return ''
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v) && Number.isSafeInteger(Number(v)) || /^-?\d+\.\d+$/.test(v)) return Number(v)
  if (v === 'true') return true
  if (v === 'false') return false
  if (v === 'null') return null
  return v
}

export function csvToJson(text: string, o: { delimiter: string; header: boolean; infer: boolean }): unknown[] {
  const rows = parseCsv(text, o.delimiter).filter((r) => !(r.length === 1 && r[0] === ''))
  if (rows.length === 0) return []
  const conv = (v: string) => (o.infer ? parseScalar(v) : v)
  if (!o.header) return rows.map((r) => r.map(conv))
  const [head, ...rest] = rows
  return rest.map((r, idx) => {
    if (r.length > head.length) throw new Error(`Row ${idx + 2} has ${r.length} fields but the header has ${head.length}.`)
    return Object.fromEntries(head.map((h, i) => [h, conv(r[i] ?? '')]))
  })
}

const cell = (v: unknown, d: string) => {
  const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /["\n\r]/.test(s) || s.includes(d) ? `"${s.replace(/"/g, '""')}"` : s
}

export function jsonToCsv(value: unknown, delimiter = ','): string {
  if (!Array.isArray(value)) throw new Error('JSON must be an array of objects (or an array of arrays) to convert to CSV.')
  if (value.length === 0) return ''
  if (value.every(Array.isArray)) return value.map((r) => (r as unknown[]).map((v) => cell(v, delimiter)).join(delimiter)).join('\n')
  if (!value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) throw new Error('Every array item must be an object (or every item an array).')
  const keys: string[] = []
  for (const o of value as Record<string, unknown>[]) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k)
  return [keys.map((k) => cell(k, delimiter)).join(delimiter), ...(value as Record<string, unknown>[]).map((o) => keys.map((k) => cell(o[k], delimiter)).join(delimiter))].join('\n')
}
