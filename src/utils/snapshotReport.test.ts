import { generateSnapshotReport, printSnapshotReport } from './snapshotReport';
import { EnvSnapshot } from './envSnapshot';

/**
 * Tests for snapshotReport utilities
 */

const baseSnapshot: EnvSnapshot = {
  hash: 'abc123',
  timestamp: '2024-01-15T10:00:00.000Z',
  entries: [
    { key: 'API_KEY', value: 'secret' },
    { key: 'DB_HOST', value: 'localhost' },
    { key: 'PORT', value: '3000' },
  ],
};

const updatedSnapshot: EnvSnapshot = {
  hash: 'def456',
  timestamp: '2024-01-16T10:00:00.000Z',
  entries: [
    { key: 'API_KEY', value: 'new-secret' },
    { key: 'DB_HOST', value: 'localhost' },
    { key: 'PORT', value: '4000' },
    { key: 'NEW_VAR', value: 'added' },
  ],
};

describe('generateSnapshotReport', () => {
  it('should return a match result when snapshots are identical', () => {
    const report = generateSnapshotReport(baseSnapshot, baseSnapshot);
    expect(report.match).toBe(true);
    expect(report.added).toHaveLength(0);
    expect(report.removed).toHaveLength(0);
    expect(report.changed).toHaveLength(0);
  });

  it('should detect added keys', () => {
    const report = generateSnapshotReport(baseSnapshot, updatedSnapshot);
    expect(report.added).toContain('NEW_VAR');
  });

  it('should detect removed keys', () => {
    const report = generateSnapshotReport(updatedSnapshot, baseSnapshot);
    expect(report.removed).toContain('NEW_VAR');
  });

  it('should detect changed values', () => {
    const report = generateSnapshotReport(baseSnapshot, updatedSnapshot);
    expect(report.changed).toContainEqual(
      expect.objectContaining({ key: 'API_KEY' })
    );
    expect(report.changed).toContainEqual(
      expect.objectContaining({ key: 'PORT' })
    );
  });

  it('should not flag unchanged keys as changed', () => {
    const report = generateSnapshotReport(baseSnapshot, updatedSnapshot);
    const changedKeys = report.changed.map((c) => c.key);
    expect(changedKeys).not.toContain('DB_HOST');
  });

  it('should set match to false when there are differences', () => {
    const report = generateSnapshotReport(baseSnapshot, updatedSnapshot);
    expect(report.match).toBe(false);
  });

  it('should include hash and timestamp metadata in report', () => {
    const report = generateSnapshotReport(baseSnapshot, updatedSnapshot);
    expect(report.fromHash).toBe(baseSnapshot.hash);
    expect(report.toHash).toBe(updatedSnapshot.hash);
    expect(report.fromTimestamp).toBe(baseSnapshot.timestamp);
    expect(report.toTimestamp).toBe(updatedSnapshot.timestamp);
  });
});

describe('printSnapshotReport', () => {
  it('should print a match message when snapshots are identical', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const report = generateSnapshotReport(baseSnapshot, baseSnapshot);
    printSnapshotReport(report);
    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toMatch(/no changes|match|identical/i);
    consoleSpy.mockRestore();
  });

  it('should print added, removed, and changed keys when differences exist', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const report = generateSnapshotReport(baseSnapshot, updatedSnapshot);
    printSnapshotReport(report);
    const output = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toMatch(/NEW_VAR/);
    expect(output).toMatch(/API_KEY/);
    expect(output).toMatch(/PORT/);
    consoleSpy.mockRestore();
  });
});
