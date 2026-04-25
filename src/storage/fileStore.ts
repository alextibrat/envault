import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ENVAULT_DIR = path.join(os.homedir(), '.envault');
const VAULT_FILE = path.join(ENVAULT_DIR, 'vault.json');

export interface VaultEntry {
  project: string;
  encryptedData: string;
  iv: string;
  salt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultStore {
  entries: Record<string, VaultEntry>;
}

function ensureVaultDir(): void {
  if (!fs.existsSync(ENVAULT_DIR)) {
    fs.mkdirSync(ENVAULT_DIR, { recursive: true, mode: 0o700 });
  }
}

function readVault(): VaultStore {
  ensureVaultDir();
  if (!fs.existsSync(VAULT_FILE)) {
    return { entries: {} };
  }
  const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
  return JSON.parse(raw) as VaultStore;
}

function writeVault(store: VaultStore): void {
  ensureVaultDir();
  fs.writeFileSync(VAULT_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function saveEntry(project: string, entry: Omit<VaultEntry, 'project' | 'version' | 'createdAt' | 'updatedAt'>): VaultEntry {
  const store = readVault();
  const existing = store.entries[project];
  const now = new Date().toISOString();

  const newEntry: VaultEntry = {
    ...entry,
    project,
    version: existing ? existing.version + 1 : 1,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };

  store.entries[project] = newEntry;
  writeVault(store);
  return newEntry;
}

export function getEntry(project: string): VaultEntry | null {
  const store = readVault();
  return store.entries[project] ?? null;
}

export function listEntries(): VaultEntry[] {
  const store = readVault();
  return Object.values(store.entries);
}

export function deleteEntry(project: string): boolean {
  const store = readVault();
  if (!store.entries[project]) return false;
  delete store.entries[project];
  writeVault(store);
  return true;
}
