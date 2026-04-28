import * as fs from "fs";
import * as path from "path";
import { loadConfig, configExists } from "../config/envaultConfig";
import { getEntry, listEntries } from "../storage/fileStore";
import { decryptEnvFile, unwrapMetadata } from "../crypto";

/**
 * Supported export formats.
 */
export type ExportFormat = "env" | "json" | "yaml";

/**
 * Converts a parsed key-value record to .env file format.
 */
function toEnvFormat(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => {
      // Quote values that contain spaces or special characters
      const needsQuotes = /[\s#"'`$\\]/.test(value);
      return needsQuotes ? `${key}="${value.replace(/"/g, '\\"')}"` : `${key}=${value}`;
    })
    .join("\n");
}

/**
 * Converts a parsed key-value record to JSON format.
 */
function toJsonFormat(vars: Record<string, string>): string {
  return JSON.stringify(vars, null, 2);
}

/**
 * Converts a parsed key-value record to YAML format (simple, no dependencies).
 */
function toYamlFormat(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => {
      const needsQuotes = /[:#{}\[\],&*?|<>=!%@`]/.test(value) || value.trim() !== value;
      return needsQuotes ? `${key}: "${value.replace(/"/g, '\\"')}"` : `${key}: ${value}`;
    })
    .join("\n");
}

/**
 * Parses decrypted .env content into a key-value record.
 */
function parseEnvContent(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) vars[key] = value;
  }
  return vars;
}

/**
 * Exports an environment entry to a file or stdout in the specified format.
 *
 * @param environment - The environment name to export (e.g. "production").
 * @param passphrase  - The passphrase used for decryption.
 * @param format      - Output format: "env", "json", or "yaml".
 * @param outputPath  - Optional file path to write to; if omitted, prints to stdout.
 */
export async function exportCommand(
  environment: string,
  passphrase: string,
  format: ExportFormat = "env",
  outputPath?: string
): Promise<void> {
  if (!configExists()) {
    console.error("envault is not initialized. Run `envault init` first.");
    process.exit(1);
  }

  const config = loadConfig();
  const project = config.project;

  const entries = listEntries(project, environment);
  if (entries.length === 0) {
    console.error(`No entries found for environment "${environment}".`);
    process.exit(1);
  }

  // Use the latest version
  const latestVersion = entries[entries.length - 1];
  const encrypted = getEntry(project, environment, latestVersion);

  if (!encrypted) {
    console.error(`Could not read entry for version "${latestVersion}".`);
    process.exit(1);
  }

  let decrypted: string;
  try {
    const { ciphertext } = unwrapMetadata(encrypted);
    decrypted = await decryptEnvFile(ciphertext, passphrase);
  } catch {
    console.error("Decryption failed. Check your passphrase.");
    process.exit(1);
  }

  const vars = parseEnvContent(decrypted);

  let output: string;
  switch (format) {
    case "json":
      output = toJsonFormat(vars);
      break;
    case "yaml":
      output = toYamlFormat(vars);
      break;
    case "env":
    default:
      output = toEnvFormat(vars);
      break;
  }

  if (outputPath) {
    const resolved = path.resolve(outputPath);
    fs.writeFileSync(resolved, output + "\n", "utf-8");
    console.log(`Exported "${environment}" (v${latestVersion}) to ${resolved} [${format}]`);
  } else {
    process.stdout.write(output + "\n");
  }
}
