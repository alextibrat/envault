import { loadConfig } from '../config/envaultConfig';
import { decryptEnvFile } from '../crypto';
import { getEntry } from '../storage/fileStore';
import * as fs from 'fs';
import * as path from 'path';

export interface PullOptions {
  env?: string;
  passphrase?: string;
  output?: string;
}

export async function pullCommand(options: PullOptions = {}): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    throw new Error('No envault config found. Run `envault init` first.');
  }

  const envFile = options.env ?? config.defaultEnv ?? '.env';
  const passphrase = options.passphrase ?? config.passphrase;

  if (!passphrase) {
    throw new Error('No passphrase provided. Set one in config or pass --passphrase.');
  }

  const entryKey = path.basename(envFile);
  const encrypted = await getEntry(config.vaultDir ?? '.envault', entryKey);

  if (!encrypted) {
    throw new Error(`No vault entry found for "${entryKey}". Push it first.`);
  }

  const plaintext = await decryptEnvFile(encrypted, passphrase);

  const outputPath = path.resolve(process.cwd(), options.output ?? envFile);
  fs.writeFileSync(outputPath, plaintext, 'utf-8');

  console.log(`✔ Pulled and decrypted "${entryKey}" to ${outputPath}.`);
}
