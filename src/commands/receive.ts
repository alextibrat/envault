import { loadConfig } from '../config/envaultConfig';
import { decryptEnvFile } from '../crypto';
import { saveEntry } from '../storage/fileStore';
import * as fs from 'fs';
import * as path from 'path';

export interface ReceiveOptions {
  filePath: string;
  recipientKey?: string;
  overwrite?: boolean;
}

export interface SharePayload {
  environment: string;
  format: 'env' | 'json';
  ciphertext: string;
  sharedAt: string;
  version: number;
}

export async function receiveEnv(options: ReceiveOptions): Promise<void> {
  const { filePath, recipientKey, overwrite = false } = options;

  const config = await loadConfig();
  if (!config) {
    throw new Error('No envault config found. Run `envault init` first.');
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Share file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  let payload: SharePayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error('Invalid share file format.');
  }

  const decryptionKey = recipientKey ?? config.secret;
  const decrypted = await decryptEnvFile(payload.ciphertext, decryptionKey);

  let envContent = decrypted;
  if (payload.format === 'json') {
    const obj = JSON.parse(decrypted) as Record<string, string>;
    envContent = Object.entries(obj)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  }

  const reEncrypted = await (await import('../crypto')).encryptEnvFile(envContent, config.secret);

  await saveEntry(config.vault, payload.environment, reEncrypted, overwrite);

  console.log(`✅ Received '${payload.environment}' (shared at ${payload.sharedAt}) into vault.`);
}
