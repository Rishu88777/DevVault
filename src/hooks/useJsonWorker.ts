import { useCallback, useRef } from 'react'
import type { JsonJob, JsonJobResult } from '@/lib/formatting/json'
import { runJsonJob } from '@/lib/formatting/json'
import { localCompare, type DiffJobResult } from '@/lib/comparison/compare'
import type { DiffOptions } from '@/lib/comparison/jsonDiff'
import type { WorkerRequest, WorkerResponse } from '@/workers/json.worker'

/** Inputs larger than this are processed off the main thread so the UI never freezes. */
const WORKER_THRESHOLD = 150_000

export function useJsonWorker() {
  const worker = useRef<Worker | null>(null)
  const seq = useRef(0)

  const call = useCallback(<T,>(req: WorkerRequest, fallback: () => T): Promise<T> => {
    if (typeof Worker === 'undefined') return Promise.resolve(fallback())
    worker.current ??= new Worker(new URL('../workers/json.worker.ts', import.meta.url), { type: 'module' })
    const w = worker.current
    const id = ++seq.current
    return new Promise<T>((resolve, reject) => {
      const onMsg = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id !== id) return
        w.removeEventListener('message', onMsg)
        resolve(e.data.result as T)
      }
      w.addEventListener('message', onMsg)
      w.addEventListener('error', () => { w.terminate(); worker.current = null; reject(new Error('Background worker failed.')) }, { once: true })
      w.postMessage({ ...req, id })
    })
  }, [])

  const format = useCallback((job: JsonJob): Promise<JsonJobResult> =>
    job.text.length > WORKER_THRESHOLD ? call({ type: 'format', job }, () => runJsonJob(job)) : Promise.resolve(runJsonJob(job)), [call])

  const compare = useCallback((a: string, b: string, options: Partial<DiffOptions>): Promise<DiffJobResult> => {
    const local = (): DiffJobResult => localCompare(a, b, options)
    return a.length + b.length > WORKER_THRESHOLD ? call({ type: 'compare', a, b, options }, local) : Promise.resolve(local())
  }, [call])

  return { format, compare }
}
