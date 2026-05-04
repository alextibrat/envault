import {
  parseEnvToEntries,
  hashEnvContent,
  createSnapshot,
  snapshotsMatch,
} from './envSnapshot';

const SAMPLE_ENV = `# comment\nFOO=bar\nBAZ=qux\nSECRET=abc123`;
const REORDERED_ENV = `BAZ=qux\nSECRET=abc123\nFOO=bar`;
const DIFFERENT_ENV = `FOO=changed\nBAZ=qux`;

describe('parseEnvToEntries', () => {
  it('parses key-value pairs', () => {
    const result = parseEnvToEntries(SAMPLE_ENV);
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux', SECRET: 'abc123' });
  });

  it('ignores comments and blank lines', () => {
    const result = parseEnvToEntries('# ignore\n\nKEY=val');
    expect(result).toEqual({ KEY: 'val' });
  });

  it('handles lines without equals sign', () => {
    const result = parseEnvToEntries('INVALID\nKEY=val');
    expect(result).toEqual({ KEY: 'val' });
  });
});

describe('hashEnvContent', () => {
  it('produces a hex string', () => {
    const hash = hashEnvContent(SAMPLE_ENV);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is order-independent', () => {
    expect(hashEnvContent(SAMPLE_ENV)).toBe(hashEnvContent(REORDERED_ENV));
  });

  it('differs when values change', () => {
    expect(hashEnvContent(SAMPLE_ENV)).not.toBe(hashEnvContent(DIFFERENT_ENV));
  });
});

describe('createSnapshot', () => {
  it('returns correct key count and sorted keys', () => {
    const snap = createSnapshot(SAMPLE_ENV);
    expect(snap.keyCount).toBe(3);
    expect(snap.keys).toEqual(['BAZ', 'FOO', 'SECRET']);
  });

  it('includes a valid ISO timestamp', () => {
    const snap = createSnapshot(SAMPLE_ENV);
    expect(() => new Date(snap.timestamp)).not.toThrow();
  });
});

describe('snapshotsMatch', () => {
  it('returns true for identical content', () => {
    const a = createSnapshot(SAMPLE_ENV);
    const b = createSnapshot(REORDERED_ENV);
    expect(snapshotsMatch(a, b)).toBe(true);
  });

  it('returns false for different content', () => {
    const a = createSnapshot(SAMPLE_ENV);
    const b = createSnapshot(DIFFERENT_ENV);
    expect(snapshotsMatch(a, b)).toBe(false);
  });
});
