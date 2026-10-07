import { describe, expect, it } from 'vitest'
import { aesDecrypt, aesEncrypt, parseAesKey, generateAesKey, DecryptError, type AesMode, type AesKeyBits } from './aes'
import { hashBytes, hmacBytes, HASH_ALGORITHMS } from './hash'
import { bytesToHex, hexToBytes, utf8Encode, utf8Decode } from '../encoding/bytes'
import { decodeJwt, signJwt, verifyJwt, summarizeClaims } from './jwt'
import { generatePassword, passwordEntropyBits, randomInt, randomString, uuidV4, uuidV7 } from './random'
import { generateRsaKeyPair, rsaOaepDecrypt, rsaOaepEncrypt, rsaSign, rsaVerify } from './rsa'

const hex = async (id: string, s: string, n?: number) => bytesToHex(await hashBytes(id, utf8Encode(s), n))

describe('hashing', () => {
  it('matches known digests of "abc"', async () => {
    expect(await hex('md5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(await hex('sha1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(await hex('sha224', 'abc')).toBe('23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7')
    expect(await hex('sha256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(await hex('sha3-256', 'abc')).toBe('3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532')
    expect(await hex('shake128', 'abc', 16)).toBe('5881092dd818bf5cf8a3ddb793fbcba7')
    expect((await hex('sha512', 'abc')).startsWith('ddaf35a193617aba')).toBe(true)
    expect((await hex('blake2s', 'abc')).startsWith('508c5e8c327c14e2')).toBe(true)
  })
  it('hashes the empty string', async () => {
    expect(await hex('sha256', '')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
  it('every algorithm produces output', async () => {
    for (const a of HASH_ALGORITHMS) expect((await hashBytes(a.id, utf8Encode('x'))).length).toBeGreaterThan(0)
  })
  it('HMAC-SHA256 matches RFC 4231 case 2', async () => {
    const r = await hmacBytes('SHA-256', utf8Encode('Jefe'), utf8Encode('what do ya want for nothing?'))
    expect(bytesToHex(r)).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
  })
  it('HMAC supports an empty key', async () => {
    const r = await hmacBytes('SHA-256', new Uint8Array(), utf8Encode(''))
    expect(bytesToHex(r)).toBe('b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad')
  })
})

describe('AES', () => {
  it('matches the NIST AES-128-GCM zero vector', async () => {
    const r = await aesEncrypt({ mode: 'GCM', key: new Uint8Array(16), iv: new Uint8Array(12), plaintext: new Uint8Array(16), prependIv: false })
    expect(bytesToHex(r.ciphertext)).toBe('0388dace60b6a392f328c2b971b2fe78' + 'ab6e47d42cec13bdf53a67b21257bddf')
  })
  const sizes: AesKeyBits[] = [128, 256]
  for (const mode of ['GCM', 'CBC', 'CTR'] as AesMode[]) {
    for (const bits of sizes) {
      for (const prepend of [true, false]) {
        it(`round-trips AES-${bits}-${mode} (prepend IV: ${prepend})`, async () => {
          const key = generateAesKey(bits)
          const text = 'Hello, wörld! 🔐 '.repeat(5)
          const enc = await aesEncrypt({ mode, key, plaintext: utf8Encode(text), prependIv: prepend })
          const dec = await aesDecrypt({ mode, key, data: enc.output, iv: enc.iv, ivPrepended: prepend })
          expect(utf8Decode(dec)).toBe(text)
        })
      }
    }
  }
  it('generates a fresh nonce each time', async () => {
    const key = generateAesKey(256)
    const a = await aesEncrypt({ mode: 'GCM', key, plaintext: utf8Encode('x'), prependIv: true })
    const b = await aesEncrypt({ mode: 'GCM', key, plaintext: utf8Encode('x'), prependIv: true })
    expect(bytesToHex(a.iv)).not.toBe(bytesToHex(b.iv))
  })
  it('fails with a wrong key / tampered data (GCM)', async () => {
    const key = generateAesKey(256)
    const enc = await aesEncrypt({ mode: 'GCM', key, plaintext: utf8Encode('secret'), prependIv: true })
    await expect(aesDecrypt({ mode: 'GCM', key: generateAesKey(256), data: enc.output, ivPrepended: true })).rejects.toBeInstanceOf(DecryptError)
    const t = enc.output.slice(); t[t.length - 1] ^= 1
    await expect(aesDecrypt({ mode: 'GCM', key, data: t, ivPrepended: true })).rejects.toThrow('Unable to decrypt')
  })
  it('validates key and IV lengths', async () => {
    expect(() => parseAesKey('short', 'utf8', 256)).toThrow(/32 bytes/)
    expect(parseAesKey('0123456789abcdef', 'utf8', 128).length).toBe(16)
    await expect(aesEncrypt({ mode: 'GCM', key: new Uint8Array(16), iv: new Uint8Array(5), plaintext: new Uint8Array(1), prependIv: false })).rejects.toThrow(/12 bytes/)
  })
  it('supports AES-192 or reports a clear limitation', async () => {
    const key = generateAesKey(192)
    try {
      const enc = await aesEncrypt({ mode: 'CBC', key, plaintext: utf8Encode('x'), prependIv: true })
      expect(utf8Decode(await aesDecrypt({ mode: 'CBC', key, data: enc.output, ivPrepended: true }))).toBe('x')
    } catch (e) {
      expect((e as Error).message).toMatch(/does not support/)
    }
  })
})

describe('JWT', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  it('decodes the jwt.io sample', () => {
    const d = decodeJwt(token)
    expect(d.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(d.payload.name).toBe('John Doe')
    expect(summarizeClaims(d.header, d.payload).find((c) => c.key === 'iat')?.value).toContain('2018-01-18')
  })
  it('verifies HS256 and rejects the wrong secret', async () => {
    expect(await verifyJwt(token, 'your-256-bit-secret')).toEqual({ valid: true })
    expect((await verifyJwt(token, 'nope')).valid).toBe(false)
  })
  it('signs and verifies HS512 round trip', async () => {
    const t = await signJwt('HS512', { typ: 'JWT' }, { sub: 'a' }, 'k')
    expect(await verifyJwt(t, 'k')).toEqual({ valid: true })
    expect(decodeJwt(t).header.alg).toBe('HS512')
  })
  it('rejects malformed tokens', () => {
    expect(() => decodeJwt('a.b')).toThrow(/3 dot-separated/)
    expect(() => decodeJwt('a.b.c')).toThrow(/not valid/)
  })
  it('flags alg "none"', async () => {
    const none = `${btoa('{"alg":"none"}').replace(/=/g, '')}.${btoa('{}').replace(/=/g, '')}.`
    expect((await verifyJwt(none, 'x')).valid).toBe(false)
  })
})

describe('RSA', () => {
  it('OAEP encrypt/decrypt round trip', async () => {
    const kp = await generateRsaKeyPair('encrypt', 2048, 'SHA-256')
    const ct = await rsaOaepEncrypt(kp.publicPem, 'SHA-256', 'hello rsa')
    expect(await rsaOaepDecrypt(kp.privatePem, 'SHA-256', ct)).toBe('hello rsa')
  })
  it('PSS sign/verify, and RS256 JWT with the same key material', async () => {
    const kp = await generateRsaKeyPair('sign', 2048, 'SHA-256')
    const sig = await rsaSign(kp.privatePem, 'RSA-PSS', 'SHA-256', 'msg')
    expect(await rsaVerify(kp.publicPem, 'RSA-PSS', 'SHA-256', 'msg', sig)).toBe(true)
    expect(await rsaVerify(kp.publicPem, 'RSA-PSS', 'SHA-256', 'msg2', sig)).toBe(false)
    const jwt = await signJwt('RS256', {}, { a: 1 }, kp.privatePem)
    expect(await verifyJwt(jwt, kp.publicPem)).toEqual({ valid: true })
  })
  it('rejects oversized OAEP messages', async () => {
    const kp = await generateRsaKeyPair('encrypt', 2048, 'SHA-256')
    await expect(rsaOaepEncrypt(kp.publicPem, 'SHA-256', 'x'.repeat(300))).rejects.toThrow(/at most 190/)
  })
}, 30000)

describe('random generators', () => {
  it('uuid v4 / v7 have correct shape', () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    const a = uuidV7(1700000000000), b = uuidV7(1700000000000)
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(a.replace(/-/g, '').slice(0, 12)).toBe((1700000000000).toString(16).padStart(12, '0'))
    expect(a < b).toBe(true)
    expect(new Set(Array.from({ length: 500 }, uuidV4)).size).toBe(500)
  })
  it('randomInt stays in range and covers it', () => {
    const seen = new Set(Array.from({ length: 400 }, () => randomInt(5)))
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4])
    expect(() => randomInt(0)).toThrow()
  })
  const base = { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false }
  it('passwords honour length and every selected class', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword({ ...base, length: 8 })
      expect(p).toHaveLength(8)
      expect(p).toMatch(/[A-Z]/); expect(p).toMatch(/[a-z]/); expect(p).toMatch(/[0-9]/); expect(p).toMatch(/[^A-Za-z0-9]/)
    }
  })
  it('passwords exclude ambiguous characters and reject bad options', () => {
    for (let i = 0; i < 30; i++) expect(generatePassword({ ...base, symbols: false, excludeAmbiguous: true })).not.toMatch(/[Il1O0o]/)
    expect(() => generatePassword({ ...base, uppercase: false, lowercase: false, numbers: false, symbols: false })).toThrow(/at least one/)
    expect(() => generatePassword({ ...base, length: 2 })).toThrow()
    expect(passwordEntropyBits({ ...base, length: 10, uppercase: false, lowercase: false, symbols: false })).toBe(33)
  })
  it('random strings use only the charset', () => {
    expect(randomString('ab', 100)).toMatch(/^[ab]{100}$/)
    expect(() => randomString('', 3)).toThrow()
  })
  it('hexToBytes sanity', () => expect(hexToBytes('ff00').length).toBe(2))
})
