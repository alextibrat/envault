import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditEnvironment, formatAuditReport } from './audit';
import * as fileStore from '../storage/fileStore';
import * as cryptoIndex from '../crypto/index';
import * as envaultConfig from '../config/envaultConfig';

vi.mock('../storage/fileStore');
vi.mock('../crypto/index');
vi.mock('../config/envaultConfig');

const mockConfig = { projectName: 'test-project', defaultEnvironment: 'development' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(envaultConfig.loadConfig).mockResolvedValue(mockConfig as any);
});

describe('auditEnvironment', () => {
  it('throws if no config found', async () => {
    vi.mocked(envaultConfig.loadConfig).mockResolvedValue(null);
    await expect(auditEnvironment('development', 'pass')).rejects.toThrow('No envault config found');
  });

  it('throws if no versions found', async () => {
    vi.mocked(fileStore.listEntries).mockResolvedValue([]);
    await expect(auditEnvironment('development', 'pass')).rejects.toThrow('No versions found');
  });

  it('returns audit report with valid entries', async () => {
    vi.mocked(fileStore.listEntries).mockResolvedValue([1, 2]);
    vi.mocked(fileStore.getEntry)
      .mockResolvedValueOnce('encrypted-blob-1')
      .mockResolvedValueOnce('encrypted-blob-2');
    vi.mocked(cryptoIndex.unwrapMetadata)
      .mockReturnValueOnce({ metadata: { pushedAt: '2024-01-01T00:00:00Z', pushedBy: 'alice', keyCount: 3 }, ciphertext: 'abcdefghijk' } as any)
      .mockReturnValueOnce({ metadata: { pushedAt: '2024-01-02T00:00:00Z', pushedBy: 'bob', keyCount: 5 }, ciphertext: 'xyz12345678' } as any);

    const report = await auditEnvironment('development', 'pass');

    expect(report.environment).toBe('development');
    expect(report.totalVersions).toBe(2);
    expect(report.entries[0].pushedBy).toBe('alice');
    expect(report.entries[1].keyCount).toBe(5);
  });

  it('marks corrupted entries gracefully', async () => {
    vi.mocked(fileStore.listEntries).mockResolvedValue([1]);
    vi.mocked(fileStore.getEntry).mockResolvedValue('bad-data');
    vi.mocked(cryptoIndex.unwrapMetadata).mockImplementation(() => { throw new Error('parse error'); });

    const report = await auditEnvironment('development', 'pass');
    expect(report.entries[0].pushedAt).toBe('corrupted');
    expect(report.entries[0].keyCount).toBe(-1);
  });
});

describe('formatAuditReport', () => {
  it('formats report as readable table', () => {
    const report = {
      environment: 'staging',
      totalVersions: 1,
      entries: [{ version: 1, pushedAt: '2024-01-01T00:00:00Z', pushedBy: 'alice', keyCount: 4, checksum: 'abcd1234...' }],
    };
    const output = formatAuditReport(report);
    expect(output).toContain('staging');
    expect(output).toContain('alice');
    expect(output).toContain('abcd1234...');
  });
});
