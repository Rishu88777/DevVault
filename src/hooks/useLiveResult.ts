import { useEffect, useState, type DependencyList } from 'react'

/**
 * Runs `compute` automatically (debounced) whenever `deps` change — no "Convert" button needed.
 * Returns the latest value or error; stale async results are discarded.
 */
export function useLiveResult<T>(compute: () => Promise<T> | T, deps: DependencyList, { enabled = true, delay = 120 }: { enabled?: boolean; delay?: number } = {}) {
  const [state, setState] = useState<{ value?: T; error?: unknown }>({})
  useEffect(() => {
    if (!enabled) { setState({}); return }
    let cancelled = false
    const t = setTimeout(() => {
      Promise.resolve().then(compute).then(
        (value) => { if (!cancelled) setState({ value }) },
        (error) => { if (!cancelled) setState({ error }) },
      )
    }, delay)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delay, ...deps])
  return state
}
