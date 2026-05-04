import * as path from 'path';
import * as fs from 'fs';
import { loadConfig } from '../config/envaultConfig';
import { getEntry } from '../storage/fileStore';
import { decryptEnvFile } from '../crypto/index';
import { createSnapshot, EnvSnapshot } from '../utils/envSnapshot';

const SNAPSHOT_DIR = '.envault/snapshots';

function snapshotFilePath(project: string, environment: string): string {
  return path.join(SNAPSHOT_DIR, `${project}__${environment}.json`);
}

function ensureSnapshotDir(): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

export function saveSnapshot(project: string, environment: string, snapshot: EnvSnapshot): void {
  ensureSnapshotDir();
  fs.writeFileSync(snapshotFilePath(project, environment), JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function loadSnapshot(project: string, environment: string): EnvSnapshot | null {
  const filePath = snapshotFilePath(project, environment);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as EnvSnapshot;
}

export async function runSnapshot(environment: string, passphrase: string): Promise<void> {
  const config = loadConfig();
  if (!config) {
    console.error('No envault config found. Run `envault init` first.');
    process.exit(1);
  }

  const entry = await getEntry(config.project, environment);
  if (!entry) {
    console.error(`No vault entry found for environment "${environment}".`);
    process.exit(1);
  }

  const decrypted = await decryptEnvFile(entry.ciphertext, passphrase);
  const snapshot = createSnapshot(decrypted);

  saveSnapshot(config.project, environment, snapshot);

  console.log(`Snapshot saved for [${config.project}] ${environment}`);
  console.log(`  Hash      : ${snapshot.hash}`);
  console.log(`  Keys      : ${snapshot.keyCount}`);
  console.log(`  Timestamp : ${snapshot.timestamp}`);
}
