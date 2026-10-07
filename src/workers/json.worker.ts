/// <reference lib="webworker" />
import { runJsonJob, type JsonJob } from '@/lib/formatting/json'
import { localCompare } from '@/lib/comparison/compare'
import type { DiffOptions } from '@/lib/comparison/jsonDiff'

export type WorkerRequest =
  | { type: 'format'; job: JsonJob }
  | { type: 'compare'; a: string; b: string; options: Partial<DiffOptions> }
export type WorkerResponse = { id: number; result: unknown }

self.onmessage = (e: MessageEvent<WorkerRequest & { id: number }>) => {
  const req = e.data
  const result = req.type === 'format' ? runJsonJob(req.job) : localCompare(req.a, req.b, req.options)
  ;(self as unknown as Worker).postMessage({ id: req.id, result } satisfies WorkerResponse)
}
