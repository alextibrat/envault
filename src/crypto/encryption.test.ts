import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from './encryption';
import { randomBytes } from 'crypto';

describe('encryption', () => {
  const passphrase = 'super-secret-passphrase-123';
  const plaintext = 'DATABASE_URL=postgres://user:pass@localhost:5432/mydb\nAPI_KEY=abc123';

  it('should encrypt and decrypt a string successfully', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    const result = decrypt(ciphertext, passphrase);
    expect(result).toBe(plaintext);
  });

  it('should produce different ciphertext for the same input (random IV/salt)', () => {
    const ct1 = encrypt(plaintext, passphrase);
    const ct2 = encrypt(plaintext, passphrase);
    expect(ct1).not.toBe(ct2);
  });

  it('should return a base64 encoded string', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    const decoded = Buffer.from(ciphertext, 'base64');
    expect(decoded.length).toBeGreaterThan(0);
  });

  it('should throw when decrypting with wrong passphrase', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    expect(() => decrypt(ciphertext, 'wrong-passphrase')).toThrow();
  });

  it('should throw when ciphertext is tampered', () => {
    const ciphertext = encrypt(plaintext, passphrase);
    const tampered = ciphertext.slice(0, -4) + 'AAAA';
    expect(() => decrypt(tampered, passphrase)).toThrow();
  });

  it('should derive consistent keys from the same passphrase and salt', () => {
    const salt = randomBytes(16);
    const key1 = deriveKey(passphrase, salt);
    const key2 = deriveKey(passphrase, salt);
    expect(key1.equals(key2)).toBe(true);
  });

  it('should derive different keys from different salts', () => {
    const key1 = deriveKey(passphrase, randomBytes(16));
    const key2 = deriveKey(passphrase, randomBytes(16));
    expect(key1.equals(key2)).toBe(false);
  });
});
