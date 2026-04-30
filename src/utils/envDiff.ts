/**
 * Utility for comparing two sets of env entries and producing a structured diff.
 */

export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  key: string;
  status: DiffStatus;
  oldValue?: string;
  newValue?: string;
}

export type EnvMap = Record<string, string>;

/**
 * Parse a raw .env string into a key-value map.
 * Ignores blank lines and comments.
 */
export function parseEnvToMap(raw: string): EnvMap {
  const map: EnvMap = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map[key] = value;
  }
  return map;
}

/**
 * Produce a structured diff between two env maps.
 */
export function diffEnvMaps(oldMap: EnvMap, newMap: EnvMap): DiffEntry[] {
  const allKeys = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
  const entries: DiffEntry[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const inOld = key in oldMap;
    const inNew = key in newMap;

    if (inOld && !inNew) {
      entries.push({ key, status: 'removed', oldValue: oldMap[key] });
    } else if (!inOld && inNew) {
      entries.push({ key, status: 'added', newValue: newMap[key] });
    } else if (oldMap[key] !== newMap[key]) {
      entries.push({ key, status: 'changed', oldValue: oldMap[key], newValue: newMap[key] });
    } else {
      entries.push({ key, status: 'unchanged', oldValue: oldMap[key], newValue: newMap[key] });
    }
  }

  return entries;
}

/**
 * Returns true if there are any meaningful differences (not 'unchanged').
 */
export function hasDifferences(diff: DiffEntry[]): boolean {
  return diff.some((e) => e.status !== 'unchanged');
}
