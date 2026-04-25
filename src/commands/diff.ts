import { decryptEnvFile } from '../crypto/index';
import { getEntry, listEntries } from '../storage/fileStore';
import { loadConfig } from '../config/envaultConfig';
import * as fs from 'fs';
import * as path from 'path';

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}

export function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

export function computeDiff(
  localVars: Record<string, string>,
  remoteVars: Record<string, string>
): DiffResult {
  const allKeys = new Set([...Object.keys(localVars), ...Object.keys(remoteVars)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const key of allKeys) {
    const inLocal = key in localVars;
    const inRemote = key in remoteVars;
    if (inLocal && !inRemote) removed.push(key);
    else if (!inLocal && inRemote) added.push(key);
    else if (localVars[key] !== remoteVars[key]) changed.push(key);
    else unchanged.push(key);
  }

  return { added, removed, changed, unchanged };
}

export async function diffCommand(
  environment: string,
  localEnvPath: string,
  passphrase: string
): Promise<DiffResult> {
  const config = await loadConfig();
  if (!config) throw new Error('No envault config found. Run `envault init` first.');

  const entry = await getEntry(config.project, environment);
  if (!entry) throw new Error(`No remote entry found for environment: ${environment}`);

  const remoteContent = await decryptEnvFile(entry.encryptedData, passphrase);
  const remoteVars = parseEnvContent(remoteContent);

  const resolvedPath = path.resolve(localEnvPath);
  if (!fs.existsSync(resolvedPath)) throw new Error(`Local file not found: ${resolvedPath}`);
  const localContent = fs.readFileSync(resolvedPath, 'utf-8');
  const localVars = parseEnvContent(localContent);

  return computeDiff(localVars, remoteVars);
}
