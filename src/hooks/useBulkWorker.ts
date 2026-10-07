import { useCallback, useEffect, useRef } from 'react'
import type { BulkOp, BulkRequest, BulkResponse } from '@/workers/bulk.worker'

/** Inputs longer than this (characters) are processed in a Web Worker. */
export const BULK_THRESHOLD = 300_000

let worker: Worker | null = null
let seq = 0

/** Runs Base64 jobs in a shared worker; falls back to the caller's sync function when Workers are unavailable. */
export function useBulkWorker() {
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  return useCallback(<T extends string | ArrayBuffer>(op: BulkOp, text: string): Promise<T> => {
    if (typeof Worker === 'undefined') return Promise.reject(new Error('Background processing is not available in this browser.'))
    worker ??= new Worker(new URL('../workers/bulk.worker.ts', import.meta.url), { type: 'module' })
    const w = worker
    const id = ++seq
    return new Promise<T>((resolve, reject) => {
      const onMsg = (e: MessageEvent<BulkResponse>) => {
        if (e.data.id !== id) return
        w.removeEventListener('message', onMsg)
        if (e.data.ok) resolve(e.data.result as T)
        else reject(new Error(e.data.error))
      }
      w.addEventListener('message', onMsg)
      w.postMessage({ id, op, text } satisfies BulkRequest)
    })
  }, [])
}
