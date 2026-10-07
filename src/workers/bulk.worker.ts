/// <reference lib="webworker" />
import { base64ToBytes, bytesToBase64, utf8Decode, utf8Encode } from '@/lib/encoding/bytes'
import { extractBase64 } from '@/lib/encoding/image'

export type BulkOp = 'b64enc' | 'b64dec' | 'b64bytes'
export type BulkRequest = { id: number; op: BulkOp; text: string }
export type BulkResponse = { id: number; ok: true; result: string | ArrayBuffer } | { id: number; ok: false; error: string }

/** Heavy Base64 work for very large inputs, kept off the main thread so typing and scrolling stay smooth. */
self.onmessage = (e: MessageEvent<BulkRequest>) => {
  const { id, op, text } = e.data
  const post = (r: BulkResponse, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(r, transfer)
  try {
    if (op === 'b64enc') post({ id, ok: true, result: bytesToBase64(utf8Encode(text)) })
    else if (op === 'b64dec') post({ id, ok: true, result: utf8Decode(base64ToBytes(text)) })
    else {
      const bytes = base64ToBytes(extractBase64(text))
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
      post({ id, ok: true, result: buf }, [buf])
    }
  } catch (err) {
    post({ id, ok: false, error: err instanceof Error ? err.message : 'Unable to process this input.' })
  }
}
