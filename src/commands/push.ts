import { loadConfig } from '../config/envaultConfig';
import { encryptEnvFile } from '../crypto';
import { saveEntry } from '../storage/fileStore';
import * as fs from 'fs';
import * as path from 'path';

export interface PushOptions {
  env?: string;
  passphrase?: string;
}

export async function pushCommand(options: PushOptions = {}): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    throw new Error('No envault config found. Run `envault init` first.');
  }

  const envFile = options.env ?? config.defaultEnv ?? '.env';
  const passphrase = options.passphrase ?? config.passphrase;

  if (!passphrase) {
    throw new Error('No passphrase provided. Set one in config or pass --passphrase.');
  }

  const envFilePath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Env file not found: ${envFilePath}`);
  }

  const plaintext = fs.readFileSync(envFilePath, 'utf-8');
  const encrypted = await encryptEnvFile(plaintext, passphrase);

  const entryKey = path.basename(envFile);
  await saveEntry(config.vaultDir ?? '.envault', entryKey, encrypted);

  console.log(`✔ Pushed and encrypted "${envFile}" to vault.`);
}
