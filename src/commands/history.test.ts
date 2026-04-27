import { parseHistory } from './history';
import * as fileStore from '../storage/fileStore';
import * as envaultConfig from '../config/envaultConfig';

jest.mock('../storage/fileStore');
jest.mock('../config/envaultConfig');

const mockConfig = { vaultPath: '/tmp/test-vault', defaultEnvironment: 'dev' };

const mockEntries = ['dev@1', 'dev@2', 'dev@3'];

const mockRawEntry = (version: number) =>
  JSON.stringify({
    ciphertext: 'abc123',
    metadata: {
      timestamp: `2024-01-0${version}T10:00:00.000Z`,
      encryptedAt: `2024-01-0${version}T10:00:00.000Z`,
      environment: 'dev',
    },
  });

describe('parseHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
    (fileStore.listEntries as jest.Mock).mockResolvedValue(mockEntries);
    (fileStore.getEntry as jest.Mock).mockImplementation((_vaultPath, key) => {
      const version = parseInt(key.split('@')[1], 10);
      return Promise.resolve(mockRawEntry(version));
    });
  });

  it('returns sorted history entries for the given environment', async () => {
    const history = await parseHistory('dev');
    expect(history).toHaveLength(3);
    expect(history[0].version).toBe(1);
    expect(history[1].version).toBe(2);
    expect(history[2].version).toBe(3);
  });

  it('returns empty array when no entries exist for environment', async () => {
    (fileStore.listEntries as jest.Mock).mockResolvedValue(['prod@1']);
    const history = await parseHistory('dev');
    expect(history).toHaveLength(0);
  });

  it('throws when config is not found', async () => {
    (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(null);
    await expect(parseHistory('dev')).rejects.toThrow(
      'No envault config found. Run `envault init` first.'
    );
  });

  it('skips malformed entries gracefully', async () => {
    (fileStore.getEntry as jest.Mock).mockImplementation((_vaultPath, key) => {
      if (key === 'dev@2') return Promise.resolve('not-valid-json{{');
      const version = parseInt(key.split('@')[1], 10);
      return Promise.resolve(mockRawEntry(version));
    });
    const history = await parseHistory('dev');
    expect(history).toHaveLength(2);
    expect(history.map((h) => h.version)).toEqual([1, 3]);
  });

  it('includes correct size based on raw entry length', async () => {
    const history = await parseHistory('dev');
    const raw = mockRawEntry(1);
    expect(history[0].size).toBe(raw.length);
  });
});
