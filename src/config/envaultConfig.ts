import * as fs from 'fs';
import * as path from 'path';

export interface EnvaultConfig {
  vaultDir: string;
  backend: 'file' | 's3' | 'gcs';
  defaultEnv: string;
  encryptionAlgorithm: 'aes-256-gcm';
  version: number;
}

const CONFIG_FILENAME = '.envaultrc.json';

const DEFAULT_CONFIG: EnvaultConfig = {
  vaultDir: '.envault',
  backend: 'file',
  defaultEnv: 'development',
  encryptionAlgorithm: 'aes-256-gcm',
  version: 1,
};

export function getConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILENAME);
}

export function loadConfig(cwd: string = process.cwd()): EnvaultConfig {
  const configPath = getConfigPath(cwd);
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    throw new Error(`Failed to parse config at ${configPath}`);
  }
}

export function saveConfig(config: Partial<EnvaultConfig>, cwd: string = process.cwd()): void {
  const configPath = getConfigPath(cwd);
  const existing = loadConfig(cwd);
  const merged = { ...existing, ...config };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
}

export function configExists(cwd: string = process.cwd()): boolean {
  return fs.existsSync(getConfigPath(cwd));
}
