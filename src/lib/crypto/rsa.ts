import { base64ToBytes, bytesToBase64, utf8Decode, utf8Encode } from '../encoding/bytes'
import { derToPem, pemToDer } from './pem'

export type RsaHash = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export type RsaSignScheme = 'RSA-PSS' | 'RSASSA-PKCS1-v1_5'

export interface PemKeyPair { publicPem: string; privatePem: string }

/** Keys are bound to one algorithm by Web Crypto; we generate with the requested purpose and export standard SPKI / PKCS#8 PEM. */
export async function generateRsaKeyPair(purpose: 'encrypt' | 'sign', bits: 2048 | 3072 | 4096, hash: RsaHash): Promise<PemKeyPair> {
  const name = purpose === 'encrypt' ? 'RSA-OAEP' : 'RSA-PSS'
  const kp = await crypto.subtle.generateKey({ name, modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash }, true, purpose === 'encrypt' ? ['encrypt', 'decrypt'] : ['sign', 'verify'])
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey))
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey))
  return { publicPem: derToPem(spki, 'PUBLIC KEY'), privatePem: derToPem(pkcs8, 'PRIVATE KEY') }
}

const importPublic = (pem: string, algo: RsaHashedImportParams, usage: KeyUsage) =>
  crypto.subtle.importKey('spki', pemToDer(pem, 'PUBLIC KEY') as BufferSource, algo, false, [usage])
const importPrivate = (pem: string, algo: RsaHashedImportParams, usage: KeyUsage) =>
  crypto.subtle.importKey('pkcs8', pemToDer(pem, 'PRIVATE KEY') as BufferSource, algo, false, [usage])

/** RSA-OAEP max plaintext = k - 2*hLen - 2 bytes. */
export function oaepMaxBytes(modulusBits: number, hash: RsaHash) {
  return modulusBits / 8 - 2 * (Number(hash.slice(4)) / 8) - 2
}

export async function rsaOaepEncrypt(publicPem: string, hash: RsaHash, text: string): Promise<string> {
  const k = await importPublic(publicPem, { name: 'RSA-OAEP', hash }, 'encrypt')
  const bits = (k.algorithm as RsaHashedKeyAlgorithm).modulusLength
  const data = utf8Encode(text)
  const max = oaepMaxBytes(bits, hash)
  if (data.length > max) throw new Error(`Message is ${data.length} bytes; a ${bits}-bit key with ${hash} OAEP can encrypt at most ${max} bytes. RSA is for small payloads (e.g. wrapping a symmetric key).`)
  return bytesToBase64(new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, k, data as BufferSource)))
}

export async function rsaOaepDecrypt(privatePem: string, hash: RsaHash, b64: string): Promise<string> {
  const k = await importPrivate(privatePem, { name: 'RSA-OAEP', hash }, 'decrypt')
  try {
    return utf8Decode(new Uint8Array(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, k, base64ToBytes(b64) as BufferSource)))
  } catch {
    throw new Error('Unable to decrypt: wrong private key, wrong hash, or the ciphertext was altered.')
  }
}

const signAlgo = (scheme: RsaSignScheme, hash: RsaHash) => ({ name: scheme, hash })
const signParams = (scheme: RsaSignScheme, saltLength: number) => (scheme === 'RSA-PSS' ? { name: scheme, saltLength } : { name: scheme })

export async function rsaSign(privatePem: string, scheme: RsaSignScheme, hash: RsaHash, message: string): Promise<string> {
  const k = await importPrivate(privatePem, signAlgo(scheme, hash), 'sign')
  const salt = Number(hash.slice(4)) / 8
  return bytesToBase64(new Uint8Array(await crypto.subtle.sign(signParams(scheme, salt), k, utf8Encode(message) as BufferSource)))
}

export async function rsaVerify(publicPem: string, scheme: RsaSignScheme, hash: RsaHash, message: string, sigB64: string): Promise<boolean> {
  const k = await importPublic(publicPem, signAlgo(scheme, hash), 'verify')
  const salt = Number(hash.slice(4)) / 8
  return crypto.subtle.verify(signParams(scheme, salt), k, base64ToBytes(sigB64) as BufferSource, utf8Encode(message) as BufferSource)
}
