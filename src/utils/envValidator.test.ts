import { validateKey, validateValue, validateEnvContent } from './envValidator';

describe('validateKey', () => {
  it('accepts valid uppercase keys', () => {
    expect(validateKey('DATABASE_URL')).toEqual([]);
    expect(validateKey('API_KEY')).toEqual([]);
    expect(validateKey('_PRIVATE')).toEqual([]);
  });

  it('rejects lowercase keys', () => {
    const errors = validateKey('database_url');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('database_url');
  });

  it('rejects keys starting with a digit', () => {
    const errors = validateKey('1KEY');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects empty key', () => {
    const errors = validateKey('');
    expect(errors[0]).toContain('empty');
  });
});

describe('validateValue', () => {
  it('warns on empty value', () => {
    const warnings = validateValue('SOME_KEY', '');
    expect(warnings.some(w => w.includes('empty'))).toBe(true);
  });

  it('warns on suspiciously short secret', () => {
    const warnings = validateValue('API_SECRET', 'abc');
    expect(warnings.some(w => w.includes('SECRET'))).toBe(true);
  });

  it('does not warn on long secret', () => {
    const warnings = validateValue('API_SECRET', 'supersecretvalue123');
    expect(warnings).toEqual([]);
  });

  it('does not warn on non-sensitive short value', () => {
    const warnings = validateValue('RETRY_COUNT', '3');
    expect(warnings).toEqual([]);
  });
});

describe('validateEnvContent', () => {
  it('validates a correct .env file', () => {
    const content = 'DATABASE_URL=postgres://localhost/db\nAPI_KEY=supersecretkey123\n';
    const result = validateEnvContent(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing = separator', () => {
    const result = validateEnvContent('BADLINE\n');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Missing '='"))).toBe(true);
  });

  it('detects duplicate keys', () => {
    const content = 'FOO=bar\nFOO=baz\n';
    const result = validateEnvContent(content);
    expect(result.warnings.some(w => w.includes('Duplicate'))).toBe(true);
  });

  it('ignores comments and blank lines', () => {
    const content = '# This is a comment\n\nFOO=bar\n';
    const result = validateEnvContent(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports line numbers in errors', () => {
    const content = 'VALID=ok\nbadkey=value\n';
    const result = validateEnvContent(content);
    expect(result.errors.some(e => e.startsWith('Line 2:'))).toBe(true);
  });
});
