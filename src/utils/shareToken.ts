import * as crypto from 'crypto';

export interface ShareTokenPayload {
  environment: string;
  expiresAt: number;
  vaultId: string;
}

export function generateShareToken(payload: ShareTokenPayload, secret: string): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const sig = signToken(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyShareToken(
  token: string,
  secret: string
): ShareTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const expectedSig = signToken(encoded, secret);

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload: ShareTokenPayload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8')
    );
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: ShareTokenPayload): boolean {
  return Date.now() > payload.expiresAt;
}

export function makeExpiry(hours: number): number {
  return Date.now() + hours * 60 * 60 * 1000;
}

function signToken(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}
