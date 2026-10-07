import { parseJson } from '../formatting/json'
import { DEFAULT_DIFF_OPTIONS, diffJson, type DiffEntry, type DiffOptions } from './jsonDiff'

export type DiffJobResult = { ok: true; diff: DiffEntry[] } | { ok: false; side: 'A' | 'B'; message: string; line: number; column: number }

/** Parses both documents and diffs them. Pure, so it can run on the main thread or in a worker. */
export function localCompare(a: string, b: string, options: Partial<DiffOptions>): DiffJobResult {
  const ra = parseJson(a)
  if (!ra.ok) return { ok: false, side: 'A', ...ra.error }
  const rb = parseJson(b)
  if (!rb.ok) return { ok: false, side: 'B', ...rb.error }
  return { ok: true, diff: diffJson(ra.value, rb.value, { ...DEFAULT_DIFF_OPTIONS, ...options }) }
}
