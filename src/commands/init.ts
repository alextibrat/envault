import * as path from 'path';
import * as readline from 'readline';
import { saveConfig, configExists, EnvaultConfig } from '../config/envaultConfig';
import { ensureVaultDir } from '../storage/fileStore';

export interface InitOptions {
  cwd?: string;
  force?: boolean;
  nonInteractive?: boolean;
  backend?: EnvaultConfig['backend'];
  defaultEnv?: string;
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function initEnvault(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  if (configExists(cwd) && !options.force) {
    throw new Error(
      'envault is already initialized in this directory. Use --force to reinitialize.'
    );
  }

  let backend: EnvaultConfig['backend'] = options.backend ?? 'file';
  let defaultEnv: string = options.defaultEnv ?? 'development';

  if (!options.nonInteractive) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const backendInput = await prompt(
      rl,
      `Backend storage [file/s3/gcs] (default: file): `
    );
    if (backendInput && ['file', 's3', 'gcs'].includes(backendInput.trim())) {
      backend = backendInput.trim() as EnvaultConfig['backend'];
    }

    const envInput = await prompt(
      rl,
      `Default environment (default: development): `
    );
    if (envInput.trim()) {
      defaultEnv = envInput.trim();
    }

    rl.close();
  }

  const vaultDir = path.join(cwd, '.envault');
  ensureVaultDir(vaultDir);

  saveConfig({ backend, defaultEnv }, cwd);

  console.log(`✔ envault initialized (backend: ${backend}, default env: ${defaultEnv})`);
}
