import { loadConfig } from '../config/envaultConfig';
import { getEntry, saveEntry, listEntries } from '../storage/fileStore';
import { encryptEnvFile, decryptEnvFile } from '../crypto';

export interface RotateOptions {
  environment?: string;
  verbose?: boolean;
}

export async function rotateKey(
  oldPassphrase: string,
  newPassphrase: string,
  options: RotateOptions = {}
): Promise<{ rotated: string[]; failed: string[] }> {
  const config = await loadConfig();
  const projectName = config.project;

  const environments = options.environment
    ? [options.environment]
    : await listEntries(projectName);

  const rotated: string[] = [];
  const failed: string[] = [];

  for (const env of environments) {
    try {
      const encryptedEntry = await getEntry(projectName, env);
      if (!encryptedEntry) {
        if (options.verbose) {
          console.warn(`[rotate] No entry found for environment: ${env}`);
        }
        failed.push(env);
        continue;
      }

      const plaintext = await decryptEnvFile(encryptedEntry, oldPassphrase);
      const reEncrypted = await encryptEnvFile(plaintext, newPassphrase);
      await saveEntry(projectName, env, reEncrypted);

      rotated.push(env);
      if (options.verbose) {
        console.log(`[rotate] Successfully rotated key for: ${env}`);
      }
    } catch (err) {
      failed.push(env);
      if (options.verbose) {
        console.error(`[rotate] Failed to rotate key for ${env}:`, err);
      }
    }
  }

  return { rotated, failed };
}
