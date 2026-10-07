import { useCallback, useSyncExternalStore } from 'react'

/**
 * Only non-sensitive UI preferences are ever stored (theme, sidebar, favourites, recent tool IDs).
 * Tool inputs, keys, tokens and passwords must never be passed to this module.
 */
const PREFIX = 'devcipher:'
const EVENT = 'devcipher:storage'
const cache = new Map<string, { raw: string | null; value: unknown }>()

function readRaw(key: string): string | null {
  try { return localStorage.getItem(PREFIX + key) } catch { return null }
}

export function readPref<T>(key: string, fallback: T): T {
  const raw = readRaw(key)
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = fallback
  if (raw !== null) { try { value = JSON.parse(raw) as T } catch { value = fallback } }
  cache.set(key, { raw, value })
  return value
}

export function writePref<T>(key: string, value: T) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* storage unavailable: keep working in-memory */ }
  cache.set(key, { raw: JSON.stringify(value), value })
  window.dispatchEvent(new Event(EVENT))
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb) }
}

export function usePref<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(subscribe, () => readPref(key, fallback), () => fallback)
  const set = useCallback((v: T | ((p: T) => T)) => {
    const next = typeof v === 'function' ? (v as (p: T) => T)(readPref(key, fallback)) : v
    writePref(key, next)
  }, [key, fallback])
  return [value, set]
}
