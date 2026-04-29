import { getEntry, listEntries } from '../storage/fileStore';
import { unwrapMetadata } from '../crypto/index';
import { loadConfig } from '../config/envaultConfig';

export interface AuditEntry {
  version: number;
  pushedAt: string;
  pushedBy: string;
  keyCount: number;
  checksum: string;
}

export interface AuditReport {
  environment: string;
  totalVersions: number;
  entries: AuditEntry[];
}

export async function auditEnvironment(
  environment: string,
  passphrase: string
): Promise<AuditReport> {
  const config = await loadConfig();
  if (!config) throw new Error('No envault config found. Run `envault init` first.');

  const versions = await listEntries(environment);
  if (versions.length === 0) {
    throw new Error(`No versions found for environment: ${environment}`);
  }

  const entries: AuditEntry[] = [];

  for (const version of versions) {
    const raw = await getEntry(environment, version);
    if (!raw) continue;

    try {
      const { metadata, ciphertext } = unwrapMetadata(raw);
      const keyCount = metadata.keyCount ?? 0;
      const checksum = ciphertext.slice(0, 8) + '...';

      entries.push({
        version,
        pushedAt: metadata.pushedAt ?? 'unknown',
        pushedBy: metadata.pushedBy ?? 'unknown',
        keyCount,
        checksum,
      });
    } catch {
      entries.push({
        version,
        pushedAt: 'corrupted',
        pushedBy: 'corrupted',
        keyCount: -1,
        checksum: 'N/A',
      });
    }
  }

  return {
    environment,
    totalVersions: entries.length,
    entries,
  };
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Audit Report — Environment: ${report.environment}`,
    `Total Versions: ${report.totalVersions}`,
    '',
    'Version | Pushed At                 | Pushed By       | Keys | Checksum',
    '--------|---------------------------|-----------------|------|----------',
  ];

  for (const entry of report.entries) {
    const v = String(entry.version).padEnd(7);
    const at = entry.pushedAt.padEnd(25);
    const by = entry.pushedBy.padEnd(15);
    const keys = String(entry.keyCount).padEnd(4);
    lines.push(`${v} | ${at} | ${by} | ${keys} | ${entry.checksum}`);
  }

  return lines.join('\n');
}
