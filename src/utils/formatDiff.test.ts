import { formatDiff } from './formatDiff';
import { DiffResult } from '../commands/diff';

const emptyDiff: DiffResult = { added: [], removed: [], changed: [], unchanged: [] };

describe('formatDiff', () => {
  it('shows no differences message when diff is empty', () => {
    const output = formatDiff(emptyDiff, { color: false });
    expect(output).toContain('No differences found');
  });

  it('shows added keys with + prefix', () => {
    const diff: DiffResult = { ...emptyDiff, added: ['NEW_KEY'] };
    const output = formatDiff(diff, { color: false });
    expect(output).toContain('+ NEW_KEY');
  });

  it('shows removed keys with - prefix', () => {
    const diff: DiffResult = { ...emptyDiff, removed: ['OLD_KEY'] };
    const output = formatDiff(diff, { color: false });
    expect(output).toContain('- OLD_KEY');
  });

  it('shows changed keys with ~ prefix', () => {
    const diff: DiffResult = { ...emptyDiff, changed: ['MOD_KEY'] };
    const output = formatDiff(diff, { color: false });
    expect(output).toContain('~ MOD_KEY');
  });

  it('hides unchanged keys by default', () => {
    const diff: DiffResult = { ...emptyDiff, added: ['A'], unchanged: ['B'] };
    const output = formatDiff(diff, { color: false });
    expect(output).not.toContain('  B');
  });

  it('shows unchanged keys when showUnchanged is true', () => {
    const diff: DiffResult = { ...emptyDiff, added: ['A'], unchanged: ['B'] };
    const output = formatDiff(diff, { color: false, showUnchanged: true });
    expect(output).toContain('  B');
  });

  it('includes summary line with counts', () => {
    const diff: DiffResult = { added: ['A'], removed: ['B'], changed: ['C'], unchanged: [] };
    const output = formatDiff(diff, { color: false });
    expect(output).toContain('1 added');
    expect(output).toContain('1 removed');
    expect(output).toContain('1 changed');
  });
});
