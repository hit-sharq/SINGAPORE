import crypto from 'node:crypto'

/**
 * Built-in security helpers. Everything here uses Node's own crypto module —
 * no third-party security service and no extra dependency.
 */

/* ---------- constant-time comparison ---------- */

/**
 * Compare two strings without leaking their contents through timing.
 *
 * A plain `a === b` returns as soon as it finds a mismatch, so an attacker can
 * discover a secret one character at a time by measuring responses. This
 * always compares every byte.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    // Still run a comparison so the timing does not reveal the length mismatch.
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

/* ---------- inbound payment notifications ---------- */

/*
 * There is deliberately no webhook-signature check here.
 *
 * Pesapal does not sign its IPN. Their documentation is explicit: they send
 * only pesapal_transaction_tracking_id and pesapal_merchant_reference "for
 * security reasons", and no signature or HMAC accompanies them. IP whitelisting
 * is also unavailable because their addresses can change without notice.
 *
 * An earlier version of this file verified an HMAC that Pesapal can never
 * send, which meant the webhook rejected every legitimate notification while
 * the real problem went unaddressed.
 *
 * The protection is instead server-side verification: treat everything in the
 * incoming request as a hint, then ask Pesapal over an authenticated API call
 * what the transaction's real status is. A forged request cannot invent a
 * transaction that exists on Pesapal's side. See lib/pesapal.ts and
 * lib/pesapal-verify.ts.
 */

/* ---------- password hashing (scrypt) ---------- */

const SCRYPT_KEYLEN = 64
const SCRYPT_SALT_BYTES = 16
const SCRYPT_MAXMEM = 64 * 1024 * 1024

/**
 * Hash a password with scrypt from Node's standard library.
 *
 * Format: scrypt$<salt-hex>$<hash-hex>, so the parameters travel with the hash
 * and can be raised later without invalidating existing passwords.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SCRYPT_SALT_BYTES).toString('hex')
  const hash = crypto.scryptSync(password.normalize('NFKC'), salt, SCRYPT_KEYLEN, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: SCRYPT_MAXMEM,
  })
  return `scrypt$${salt}$${hash.toString('hex')}`
}

/** Verify a password against a stored hash. Returns false on any malformed hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  const [, salt, expected] = parts
  let expectedBuf: Buffer
  try {
    expectedBuf = Buffer.from(expected, 'hex')
  } catch {
    return false
  }
  if (expectedBuf.length !== SCRYPT_KEYLEN) return false

  const actual = crypto.scryptSync(password.normalize('NFKC'), salt, SCRYPT_KEYLEN, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: SCRYPT_MAXMEM,
  })
  return crypto.timingSafeEqual(actual, expectedBuf)
}

/* ---------- secret masking ---------- */

/**
 * Reduce a secret to a recognisable but useless form, e.g. "abcd…wxyz".
 * Lets an admin confirm which credential is configured without ever
 * transmitting the credential itself.
 */
export function maskSecret(secret: string): string {
  if (secret.length <= 8) return '••••'
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`
}

/* ---------- encryption at rest ---------- */

/**
 * Encrypt a secret before storing it in the database, so a database dump or a
 * stolen backup does not hand over payment credentials in plain text.
 *
 * Uses AES-256-GCM from Node's standard library. The key comes from
 * SETTINGS_ENCRYPTION_KEY and the output carries its own IV.
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

/** Decrypt a value produced by encryptSecret. Returns null if it is not ours. */
export function decryptSecret(stored: string): string | null {
  if (!stored.startsWith('enc:v1:')) return null

  const key = getEncryptionKey()
  const [, , ivB64, tagB64, dataB64] = stored.split(':')
  if (!ivB64 || !tagB64 || !dataB64) return null

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    // Wrong key or tampered ciphertext.
    return null
  }
}

/**
 * Read a stored setting that may be encrypted, plain legacy text, or supplied
 * by the environment. Keeps backwards compatibility with rows written before
 * encryption was introduced.
 */
export function resolveStoredSecret(stored: string | null | undefined): string {
  if (!stored) return ''
  const decrypted = decryptSecret(stored)
  return decrypted ?? stored
}

function getEncryptionKey(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('SETTINGS_ENCRYPTION_KEY is required to encrypt stored secrets')
  }
  const key = crypto.createHash('sha256').update(secret, 'utf8').digest()
  return key
}

/* ---------- random tokens ---------- */

/** URL-safe random token, for invite links and one-time codes. */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

/**
 * Deterministic hash of a value, for rate-limit buckets and cache keys.
 * Never store a raw secret's hash where the secret itself would do: this is for
 * bucketing, not for authentication.
 */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/* ---------- input sanitisation ---------- */

/**
 * Strip control characters and clamp length. Used on values that are echoed
 * back into logs or rendered as text, to keep log injection and terminal
 * escape sequences out.
 */
export function sanitizeForLog(value: string, maxLength = 200): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength)
}
