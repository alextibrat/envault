export interface ParsedEnvEntry {
  key: string;
  value: string;
}

export function parseEnvEntries(content: string): ParsedEnvEntry[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return null;
      const key = line.slice(0, eqIdx).trim();
      const value = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      return { key, value };
    })
    .filter((entry): entry is ParsedEnvEntry => entry !== null);
}

export function mergeEnvEntries(
  base: ParsedEnvEntry[],
  incoming: ParsedEnvEntry[],
  strategy: 'overwrite' | 'keep-existing' = 'overwrite'
): ParsedEnvEntry[] {
  const baseMap = new Map(base.map(e => [e.key, e.value]));
  for (const entry of incoming) {
    if (strategy === 'keep-existing' && baseMap.has(entry.key)) continue;
    baseMap.set(entry.key, entry.value);
  }
  return Array.from(baseMap.entries()).map(([key, value]) => ({ key, value }));
}

export function entriesToEnvString(entries: ParsedEnvEntry[]): string {
  return entries.map(({ key, value }) => `${key}=${value}`).join('\n');
}

export function validateEnvEntries(entries: ParsedEnvEntry[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const { key } of entries) {
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      errors.push(`Invalid key name: "${key}"`);
    }
    if (seen.has(key)) {
      errors.push(`Duplicate key: "${key}"`);
    }
    seen.add(key);
  }
  return errors;
}
