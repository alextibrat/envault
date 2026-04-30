/**
 * Validates .env file content and individual key-value pairs.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
}

const KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const SUSPICIOUS_PATTERNS = [
  { pattern: /password/i, label: 'PASSWORD' },
  { pattern: /secret/i, label: 'SECRET' },
  { pattern: /token/i, label: 'TOKEN' },
  { pattern: /api_key/i, label: 'API_KEY' },
];

export function validateKey(key: string): string[] {
  const errors: string[] = [];
  if (!key || key.trim() === '') {
    errors.push('Key must not be empty.');
  } else if (!KEY_PATTERN.test(key)) {
    errors.push(`Key "${key}" must match pattern [A-Z_][A-Z0-9_]* (uppercase, digits, underscores).`);
  }
  return errors;
}

export function validateValue(key: string, value: string): string[] {
  const warnings: string[] = [];
  if (value.trim() === '') {
    warnings.push(`Key "${key}" has an empty value.`);
  }
  for (const { pattern, label } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(key) && value.length < 8) {
      warnings.push(`Key "${key}" looks like a ${label} but has a suspiciously short value.`);
    }
  }
  return warnings;
}

export function validateEnvContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenKeys = new Set<string>();
  const lines = content.split('\n');

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const lineNum = idx + 1;
    if (line === '' || line.startsWith('#')) return;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      errors.push(`Line ${lineNum}: Missing '=' separator in "${line}".`);
      return;
    }

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();

    const keyErrors = validateKey(key);
    keyErrors.forEach(e => errors.push(`Line ${lineNum}: ${e}`));

    if (seenKeys.has(key)) {
      warnings.push(`Line ${lineNum}: Duplicate key "${key}" detected.`);
    } else {
      seenKeys.add(key);
    }

    const valueWarnings = validateValue(key, value);
    valueWarnings.forEach(w => warnings.push(`Line ${lineNum}: ${w}`));
  });

  return { valid: errors.length === 0, errors, warnings };
}
