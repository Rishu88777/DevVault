export interface JsonErrorInfo {
  message: string
  line: number
  column: number
  /** 0-based character offset, when it could be determined. */
  position: number
}

function lineCol(text: string, pos: number) {
  const before = text.slice(0, pos)
  const line = before.split('\n').length
  return { line, column: pos - before.lastIndexOf('\n') }
}

/** Strict RFC 8259 scanner. Returns the first syntax error, so positions are identical in every browser. */
export function scanJsonError(text: string): { position: number; message: string } | null {
  let i = 0
  const n = text.length
  class Stop { constructor(public position: number, public message: string) {} }
  const fail = (msg: string, at = i): never => {
    throw new Stop(at, msg)
  }
  const describeChar = (at: number) => (at >= n ? 'end of input' : `token '${text[at]}'`)
  const ws = () => { while (i < n && /[ \t\r\n]/.test(text[i])) i++ }
  const lit = (word: string) => {
    if (text.startsWith(word, i)) i += word.length
    else fail(`Unexpected ${describeChar(i)}; expected '${word}'`)
  }
  const str = () => {
    i++
    while (i < n) {
      const c = text[i]
      if (c === '"') { i++; return }
      if (c === '\\') {
        const e = text[i + 1]
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail('Invalid unicode escape in string', i)
          i += 6
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) i += 2
        else fail('Invalid escape sequence in string', i)
      } else if (c < ' ') fail('Unescaped control character in string', i)
      else i++
    }
    fail('Unterminated string', n)
  }
  const num = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i))
    if (!m) fail(`Unexpected ${describeChar(i)} in number`)
    i += m![0].length
  }
  const value = (depth: number) => {
    if (depth > 512) fail('Nesting is too deep')
    ws()
    const c = text[i]
    if (c === '{') {
      i++; ws()
      if (text[i] === '}') { i++; return }
      for (;;) {
        ws()
        if (text[i] !== '"') fail(`Expected a double-quoted property name but found ${describeChar(i)}`)
        str(); ws()
        if (text[i] !== ':') fail(`Expected ':' after property name but found ${describeChar(i)}`)
        i++; value(depth + 1); ws()
        if (text[i] === ',') { i++; continue }
        if (text[i] === '}') { i++; return }
        fail(`Expected ',' or '}' after property value but found ${describeChar(i)}`)
      }
    } else if (c === '[') {
      i++; ws()
      if (text[i] === ']') { i++; return }
      for (;;) {
        value(depth + 1); ws()
        if (text[i] === ',') { i++; continue }
        if (text[i] === ']') { i++; return }
        fail(`Expected ',' or ']' after array element but found ${describeChar(i)}`)
      }
    } else if (c === '"') str()
    else if (c === 't') lit('true')
    else if (c === 'f') lit('false')
    else if (c === 'n') lit('null')
    else if (c === '-' || (c >= '0' && c <= '9')) num()
    else fail(i >= n ? 'Unexpected end of JSON input' : `Unexpected ${describeChar(i)}`)
  }
  try {
    value(0); ws()
    if (i < n) fail(`Unexpected ${describeChar(i)} after the JSON value`)
    return null
  } catch (e) {
    if (e instanceof Stop) return { position: e.position, message: e.message }
    throw e
  }
}

/** Converts a JSON.parse failure into a friendly, positioned error (position from our own scanner). */
export function describeJsonError(text: string, err: unknown): JsonErrorInfo {
  const found = scanJsonError(text)
  if (found) return { message: found.message, ...lineCol(text, found.position), position: found.position }
  const raw = err instanceof Error ? err.message : String(err)
  return { message: raw, line: 1, column: 1, position: 0 }
}

export type JsonParse = { ok: true; value: unknown } | { ok: false; error: JsonErrorInfo }

export function parseJson(text: string): JsonParse {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: describeJsonError(text, e) }
  }
}

export type IndentOption = 2 | 3 | 4 | 8 | 'tab'
export const indentString = (i: IndentOption): string | number => (i === 'tab' ? '\t' : i)

export function sortKeysDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeysDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeysDeep((v as Record<string, unknown>)[k])]))
  }
  return v
}

export type JsonJob = { op: 'format' | 'minify' | 'validate'; text: string; indent: IndentOption; sortKeys: boolean }
export type JsonJobResult = { ok: true; output: string } | { ok: false; error: JsonErrorInfo }

/** Pure implementation shared by the main thread and the Web Worker. */
export function runJsonJob(job: JsonJob): JsonJobResult {
  const r = parseJson(job.text)
  if (!r.ok) return r
  if (job.op === 'validate') return { ok: true, output: 'Valid JSON' }
  const value = job.sortKeys ? sortKeysDeep(r.value) : r.value
  return { ok: true, output: job.op === 'minify' ? JSON.stringify(value) : JSON.stringify(value, null, indentString(job.indent)) ?? '' }
}

/* ---------- Syntax highlighting (tokenizer, not regex-on-HTML) ---------- */
export type TokenKind = 'key' | 'string' | 'number' | 'bool' | 'null' | 'punct' | 'plain'
export interface Token { kind: TokenKind; text: string }

const TOKEN_RE = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],:])|(\s+)|([^\s]+)/g

export function tokenizeJson(text: string): Token[] {
  const out: Token[] = []
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[1] !== undefined) {
      out.push({ kind: m[2] ? 'key' : 'string', text: m[1] })
      if (m[2]) out.push({ kind: 'punct', text: m[2] })
    } else if (m[3] !== undefined) out.push({ kind: 'number', text: m[3] })
    else if (m[4] !== undefined) out.push({ kind: 'bool', text: m[4] })
    else if (m[5] !== undefined) out.push({ kind: 'null', text: m[5] })
    else if (m[6] !== undefined) out.push({ kind: 'punct', text: m[6] })
    else out.push({ kind: 'plain', text: m[0] })
  }
  return out
}
