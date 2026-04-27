import { getEntry, listEntries } from '../storage/fileStore';
import { loadConfig } from '../config/envaultConfig';
import chalk from 'chalk';

export interface HistoryEntry {
  version: number;
  timestamp: string;
  encryptedAt: string;
  size: number;
}

export async function parseHistory(environment: string): Promise<HistoryEntry[]> {
  const config = await loadConfig();
  if (!config) {
    throw new Error('No envault config found. Run `envault init` first.');
  }

  const entries = await listEntries(config.vaultPath);
  const envEntries = entries.filter((e) => e.startsWith(`${environment}@`));

  if (envEntries.length === 0) {
    return [];
  }

  const history: HistoryEntry[] = [];

  for (const entryKey of envEntries) {
    const raw = await getEntry(config.vaultPath, entryKey);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const versionStr = entryKey.split('@')[1];
      history.push({
        version: parseInt(versionStr, 10),
        timestamp: parsed.metadata?.timestamp ?? 'unknown',
        encryptedAt: parsed.metadata?.encryptedAt ?? 'unknown',
        size: raw.length,
      });
    } catch {
      // skip malformed entries
    }
  }

  return history.sort((a, b) => a.version - b.version);
}

export async function historyCommand(environment: string): Promise<void> {
  try {
    const history = await parseHistory(environment);

    if (history.length === 0) {
      console.log(chalk.yellow(`No history found for environment: ${environment}`));
      return;
    }

    console.log(chalk.bold(`\nHistory for environment: ${chalk.cyan(environment)}\n`));
    console.log(
      chalk.gray('Version'.padEnd(10) + 'Timestamp'.padEnd(30) + 'Size (bytes)')
    );
    console.log(chalk.gray('-'.repeat(55)));

    for (const entry of history) {
      const versionLabel = chalk.green(`v${entry.version}`.padEnd(10));
      const tsLabel = chalk.white(entry.timestamp.padEnd(30));
      const sizeLabel = chalk.yellow(String(entry.size));
      console.log(`${versionLabel}${tsLabel}${sizeLabel}`);
    }

    console.log();
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
