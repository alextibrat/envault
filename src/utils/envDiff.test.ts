import { parseEnvToMap, diffEnvMaps, hasDifferences } from './envDiff';

describe('parseEnvToMap', () => {
  it('parses simple key=value pairs', () => {
    const raw = 'FOO=bar\nBAZ=qux';
    expect(parseEnvToMap(raw)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores blank lines and comments', () => {
    const raw = '# comment\n\nFOO=bar';
    expect(parseEnvToMap(raw)).toEqual({ FOO: 'bar' });
  });

  it('handles values containing = signs', () => {
    const raw = 'URL=http://example.com?a=1&b=2';
    expect(parseEnvToMap(raw)).toEqual({ URL: 'http://example.com?a=1&b=2' });
  });

  it('returns empty map for empty string', () => {
    expect(parseEnvToMap('')).toEqual({});
  });
});

describe('diffEnvMaps', () => {
  const oldMap = { FOO: 'bar', KEEP: 'same', OLD: 'gone' };
  const newMap = { FOO: 'baz', KEEP: 'same', NEW: 'arrived' };

  it('detects changed keys', () => {
    const diff = diffEnvMaps(oldMap, newMap);
    const changed = diff.find((e) => e.key === 'FOO');
    expect(changed?.status).toBe('changed');
    expect(changed?.oldValue).toBe('bar');
    expect(changed?.newValue).toBe('baz');
  });

  it('detects removed keys', () => {
    const diff = diffEnvMaps(oldMap, newMap);
    const removed = diff.find((e) => e.key === 'OLD');
    expect(removed?.status).toBe('removed');
    expect(removed?.oldValue).toBe('gone');
  });

  it('detects added keys', () => {
    const diff = diffEnvMaps(oldMap, newMap);
    const added = diff.find((e) => e.key === 'NEW');
    expect(added?.status).toBe('added');
    expect(added?.newValue).toBe('arrived');
  });

  it('marks unchanged keys correctly', () => {
    const diff = diffEnvMaps(oldMap, newMap);
    const unchanged = diff.find((e) => e.key === 'KEEP');
    expect(unchanged?.status).toBe('unchanged');
  });

  it('returns sorted keys', () => {
    const diff = diffEnvMaps(oldMap, newMap);
    const keys = diff.map((e) => e.key);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('hasDifferences', () => {
  it('returns true when there are changes', () => {
    const diff = diffEnvMaps({ A: '1' }, { A: '2' });
    expect(hasDifferences(diff)).toBe(true);
  });

  it('returns false when maps are identical', () => {
    const diff = diffEnvMaps({ A: '1' }, { A: '1' });
    expect(hasDifferences(diff)).toBe(false);
  });

  it('returns false for empty maps', () => {
    expect(hasDifferences(diffEnvMaps({}, {}))).toBe(false);
  });
});
