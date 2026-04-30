import { getEntry } from '../storage/fileStore';
import { decryptEnvFile, encryptEnvFile } from '../crypto';
import { loadConfig } from '../config/envaultConfig';
import * as fs from 'fs';
import * as path from 'path';

export interface ShareOptions {
  environment: string;
  outputPath: string;
  recipientKey?: string;
  format?: 'env' | 'json';
}

export async function shareEnv(options: ShareOptions): Promise<void> {
  const { environment, outputPath, recipientKey, format = 'env' } = options;

  const config = await loadConfig();
  if (!config) {
    throw new Error('No envault config found. Run `envault init` first.');
  }

  const entry = await getEntry(config.vault, environment);
  if (!entry) {
    throw new Error(`No environment '${environment}' found in vault.`);
  }

  const decrypted = await decryptEnvFile(entry.ciphertext, config.secret);

  let output: string;
  if (format === 'json') {
    const pairs = parseEnvToObject(decrypted);
    output = JSON.stringify(pairs, null, 2);
  } else {
    output = decrypted;
  }

  const encryptionKey = recipientKey ?? config.secret;
  const encrypted = await encryptEnvFile(output, encryptionKey);

  const sharePayload = JSON.stringify({
    environment,
    format,
    ciphertext: encrypted,
    sharedAt: new Date().toISOString(),
    version: entry.version,
  }, null, 2);

  const resolvedPath = path.resolve(outputPath);
  fs.writeFileSync(resolvedPath, sharePayload, 'utf-8');

  console.log(`✅ Shared '${environment}' (v${entry.version}) to ${resolvedPath}`);
  if (recipientKey) {
    console.log('🔑 Encrypted with recipient key.');
  }
}

function parseEnvToObject(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}
