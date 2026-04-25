import { loadConfig } from '../config/envaultConfig';
import { listEntries } from '../storage/fileStore';

export interface ListEntry {
  name: string;
  version: number;
  updatedAt: string;
}

export async function listCommand(): Promise<void> {
  const config = await loadConfig();

  if (!config) {
    console.error('No envault config found. Run `envault init` first.');
    process.exit(1);
  }

  let entries: ListEntry[];

  try {
    entries = await listEntries(config.vaultDir);
  } catch (err) {
    console.error('Failed to read vault entries:', (err as Error).message);
    process.exit(1);
  }

  if (entries.length === 0) {
    console.log('No entries found in the vault. Use `envault push` to add one.');
    return;
  }

  console.log(`\nVault entries (${entries.length}):\n`);
  console.log(
    'NAME'.padEnd(30) + 'VERSION'.padEnd(12) + 'UPDATED AT'
  );
  console.log('-'.repeat(60));

  for (const entry of entries) {
    const formattedDate = new Date(entry.updatedAt).toLocaleString();
    console.log(
      entry.name.padEnd(30) +
        String(entry.version).padEnd(12) +
        formattedDate
    );
  }

  console.log();
}
