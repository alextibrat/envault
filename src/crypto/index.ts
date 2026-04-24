export { encrypt, decrypt, deriveKey } from './encryption';

/**
 * Encrypts the contents of a .env file string using the provided passphrase.
 * Returns a base64-encoded encrypted blob suitable for storage.
 */
export function encryptEnvFile(envContent: string, passphrase: string): string {
  const { encrypt } = require('./encryption');
  return encrypt(envContent, passphrase);
}

/**
 * Decrypts an encrypted .env blob back into a plaintext .env string.
 */
export function decryptEnvFile(encryptedBlob: string, passphrase: string): string {
  const { decrypt } = require('./encryption');
  return decrypt(encryptedBlob, passphrase);
}

export const CRYPTO_VERSION = '1';

/**
 * Wraps an encrypted blob with metadata for versioning and format detection.
 */
export function wrapWithMetadata(encryptedBlob: string): string {
  const metadata = {
    v: CRYPTO_VERSION,
    alg: 'aes-256-gcm',
    data: encryptedBlob,
  };
  return Buffer.from(JSON.stringify(metadata)).toString('base64');
}

/**
 * Unwraps a metadata envelope and returns the raw encrypted blob.
 */
export function unwrapMetadata(wrapped: string): { version: string; data: string } {
  const raw = Buffer.from(wrapped, 'base64').toString('utf8');
  const parsed = JSON.parse(raw);
  if (!parsed.v || !parsed.data) {
    throw new Error('Invalid envault envelope format');
  }
  return { version: parsed.v, data: parsed.data };
}
