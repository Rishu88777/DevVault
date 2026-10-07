/** JSON object → single escaped string literal (e.g. to embed JSON inside another JSON value or source code). */
export function jsonToString(input: string, minify = true): string {
  let v: unknown
  try { v = JSON.parse(input) } catch { throw new Error('Input is not valid JSON, so it cannot be turned into a string.') }
  return JSON.stringify(minify ? JSON.stringify(v) : JSON.stringify(v, null, 2))
}

/**
 * Escaped / stringified JSON → pretty JSON.
 * Handles: "{\"a\":1}" (quoted), {\"a\":1} (escaped but unquoted), double-encoded strings, and plain JSON.
 */
export function stringToJson(input: string, indent = 2): string {
  let text = input.trim()
  let value: unknown
  const tryParse = (s: string) => { try { return { ok: true as const, v: JSON.parse(s) } } catch { return { ok: false as const } } }
  let r = tryParse(text)
  if (!r.ok && /\\["\\/bfnrtu]/.test(text)) r = tryParse(`"${text.replace(/^"|"$/g, '').replace(/(?<!\\)"/g, '\\"')}"`)
  if (!r.ok) throw new Error('Could not read this as a JSON string. Paste something like "{\\"name\\":\\"John\\"}" or {\\"name\\":\\"John\\"}.')
  value = r.v
  for (let i = 0; i < 5 && typeof value === 'string'; i++) {
    const inner = tryParse(value)
    if (!inner.ok) break
    value = inner.v
  }
  if (typeof value === 'string') throw new Error('The text decodes to a plain string, not a JSON object or array.')
  return JSON.stringify(value, null, indent)
}
