import { createHash } from 'crypto';

export interface EnvSnapshot {
  hash: string;
  timestamp: string;
  keyCount: number;
  keys: string[];
}

/**
 * Parse a raw .env string into key-value pairs.
 */
export function parseEnvToEntries(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Generate a deterministic SHA-256 hash for the given env content.
 * Keys are sorted before hashing so order doesn't matter.
 */
export function hashEnvContent(content: string): string {
  const entries = parseEnvToEntries(content);
  const sorted = Object.keys(entries)
    .sort()
    .map((k) => `${k}=${entries[k]}`)
    .join('\n');
  return createHash('sha256').update(sorted).digest('hex');
}

/**
 * Create a snapshot descriptor for the given env content.
 */
export function createSnapshot(content: string): EnvSnapshot {
  const entries = parseEnvToEntries(content);
  const keys = Object.keys(entries).sort();
  return {
    hash: hashEnvContent(content),
    timestamp: new Date().toISOString(),
    keyCount: keys.length,
    keys,
  };
}

/**
 * Compare two snapshots and return whether they differ.
 */
export function snapshotsMatch(a: EnvSnapshot, b: EnvSnapshot): boolean {
  return a.hash === b.hash;
}
