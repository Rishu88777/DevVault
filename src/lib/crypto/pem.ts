import { base64ToBytes, bytesToBase64 } from '../encoding/bytes'

export type PemLabel = 'PUBLIC KEY' | 'PRIVATE KEY'

export function derToPem(der: Uint8Array, label: PemLabel): string {
  const b64 = bytesToBase64(der).match(/.{1,64}/g)?.join('\n') ?? ''
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----`
}

/** Extracts the DER bytes from a PEM block. Accepts bare Base64 too. Throws if the label is a different key type. */
export function pemToDer(pem: string, expected: PemLabel): Uint8Array {
  const m = pem.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/)
  if (m && m[1] !== expected) {
    throw new Error(`Expected a "${expected}" PEM but found "${m[1]}". Only ${expected === 'PUBLIC KEY' ? 'SPKI' : 'PKCS#8'} PEM is supported.`)
  }
  return base64ToBytes(m ? m[2] : pem)
}
