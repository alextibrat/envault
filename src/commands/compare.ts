/**
 * compare command — compare two stored vault versions or a version against the local .env file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from '../config/envaultConfig';
import { getEntry } from '../storage/fileStore';
import { decryptEnvFile } from '../crypto';
import { parseEnvToMap, diffEnvMaps, hasDifferences, DiffEntry } from '../utils/envDiff';
import { colorize } from '../utils/formatDiff';

function renderDiff(diff: DiffEntry[]): void {
  let anyPrinted = false;
  for (const entry of diff) {
    if (entry.status === 'added') {
      console.log(colorize('green', `+ ${entry.key}=${entry.newValue}`));
      anyPrinted = true;
    } else if (entry.status === 'removed') {
      console.log(colorize('red', `- ${entry.key}=${entry.oldValue}`));
      anyPrinted = true;
    } else if (entry.status === 'changed') {
      console.log(colorize('red', `- ${entry.key}=${entry.oldValue}`));
      console.log(colorize('green', `+ ${entry.key}=${entry.newValue}`));
      anyPrinted = true;
    }
  }
  if (!anyPrinted) {
    console.log(colorize('cyan', 'No differences found.'));
  }
}

export async function compareCommand(
  masterPassword: string,
  versionA: string,
  versionB?: string
): Promise<void> {
  const config = loadConfig();
  if (!config) {
    console.error(colorize('red', 'No envault config found. Run `envault init` first.'));
    process.exit(1);
  }

  const entryA = getEntry(config.project, versionA);
  if (!entryA) {
    console.error(colorize('red', `Version "${versionA}" not found in vault.`));
    process.exit(1);
  }

  const rawA = decryptEnvFile(entryA.encrypted, masterPassword);
  const mapA = parseEnvToMap(rawA);

  let mapB: Record<string, string>;

  if (versionB) {
    const entryB = getEntry(config.project, versionB);
    if (!entryB) {
      console.error(colorize('red', `Version "${versionB}" not found in vault.`));
      process.exit(1);
    }
    const rawB = decryptEnvFile(entryB.encrypted, masterPassword);
    mapB = parseEnvToMap(rawB);
    console.log(`Comparing vault version ${versionA} → ${versionB}`);
  } else {
    const localPath = path.resolve(process.cwd(), config.envFile ?? '.env');
    if (!fs.existsSync(localPath)) {
      console.error(colorize('red', `Local env file not found at ${localPath}.`));
      process.exit(1);
    }
    const rawLocal = fs.readFileSync(localPath, 'utf-8');
    mapB = parseEnvToMap(rawLocal);
    console.log(`Comparing vault version ${versionA} → local ${config.envFile ?? '.env'}`);
  }

  const diff = diffEnvMaps(mapA, mapB);
  renderDiff(diff);

  if (!hasDifferences(diff)) process.exit(0);
}
