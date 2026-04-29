import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from '../config/envaultConfig';
import { saveEntry } from '../storage/fileStore';
import { encryptEnvFile } from '../crypto';

export type ImportFormat = 'env' | 'json' | 'yaml';

export function parseJsonToEnv(content: string): string {
  const obj = JSON.parse(content);
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

export function parseYamlToEnv(content: string): string {
  const lines = content.split('\n').filter(l => l.includes(':'));
  return lines
    .map(line => {
      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      return `${key}=${value}`;
    })
    .join('\n');
}

export function detectFormat(filePath: string): ImportFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  return 'env';
}

export async function importCommand(
  filePath: string,
  environment: string,
  options: { format?: ImportFormat; passphrase?: string } = {}
): Promise<void> {
  const config = loadConfig();
  const passphrase = options.passphrase || config.passphrase;

  if (!passphrase) {
    throw new Error('Passphrase is required. Set it in config or pass --passphrase.');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const format = options.format || detectFormat(filePath);

  let envContent: string;
  if (format === 'json') {
    envContent = parseJsonToEnv(rawContent);
  } else if (format === 'yaml') {
    envContent = parseYamlToEnv(rawContent);
  } else {
    envContent = rawContent;
  }

  const encrypted = await encryptEnvFile(envContent, passphrase);
  await saveEntry(environment, encrypted);

  console.log(`✅ Imported ${format} file into environment "${environment}" successfully.`);
}
