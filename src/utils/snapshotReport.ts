import { EnvSnapshot, snapshotsMatch } from './envSnapshot';

export interface SnapshotReport {
  matched: boolean;
  addedKeys: string[];
  removedKeys: string[];
  summary: string;
}

/**
 * Compare a previous snapshot against a current one and produce a human-readable report.
 */
export function generateSnapshotReport(
  previous: EnvSnapshot | null,
  current: EnvSnapshot
): SnapshotReport {
  if (!previous) {
    return {
      matched: false,
      addedKeys: current.keys,
      removedKeys: [],
      summary: `No previous snapshot. Current has ${current.keyCount} key(s).`,
    };
  }

  const prevSet = new Set(previous.keys);
  const currSet = new Set(current.keys);

  const addedKeys = current.keys.filter((k) => !prevSet.has(k));
  const removedKeys = previous.keys.filter((k) => !currSet.has(k));
  const matched = snapshotsMatch(previous, current);

  const lines: string[] = [];
  if (matched) {
    lines.push('No changes detected since last snapshot.');
  } else {
    lines.push('Changes detected since last snapshot:');
    if (addedKeys.length) lines.push(`  + Added   : ${addedKeys.join(', ')}`);
    if (removedKeys.length) lines.push(`  - Removed : ${removedKeys.join(', ')}`);
    if (!addedKeys.length && !removedKeys.length) {
      lines.push('  ~ Value(s) changed (same keys, different hash).');
    }
  }

  return { matched, addedKeys, removedKeys, summary: lines.join('\n') };
}

/**
 * Print a snapshot report to stdout with optional color hints.
 */
export function printSnapshotReport(report: SnapshotReport): void {
  if (report.matched) {
    console.log('\x1b[32m✔ ' + report.summary + '\x1b[0m');
  } else {
    console.log('\x1b[33m⚠ ' + report.summary + '\x1b[0m');
  }
}
