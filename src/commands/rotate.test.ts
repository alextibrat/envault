import { rotateKey } from './rotate';
import { saveEntry, getEntry, listEntries } from '../storage/fileStore';
import { encryptEnvFile, decryptEnvFile } from '../crypto';
import { loadConfig } from '../config/envaultConfig';

jest.mock('../storage/fileStore');
jest.mock('../crypto');
jest.mock('../config/envaultConfig');

const mockLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;
const mockListEntries = listEntries as jest.MockedFunction<typeof listEntries>;
const mockGetEntry = getEntry as jest.MockedFunction<typeof getEntry>;
const mockSaveEntry = saveEntry as jest.MockedFunction<typeof saveEntry>;
const mockEncryptEnvFile = encryptEnvFile as jest.MockedFunction<typeof encryptEnvFile>;
const mockDecryptEnvFile = decryptEnvFile as jest.MockedFunction<typeof decryptEnvFile>;

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadConfig.mockResolvedValue({ project: 'test-project', backend: 'file' } as any);
});

describe('rotateKey', () => {
  it('should rotate keys for all environments', async () => {
    mockListEntries.mockResolvedValue(['development', 'staging']);
    mockGetEntry.mockResolvedValue('encrypted-data');
    mockDecryptEnvFile.mockResolvedValue('KEY=value\nSECRET=abc');
    mockEncryptEnvFile.mockResolvedValue('new-encrypted-data');
    mockSaveEntry.mockResolvedValue(undefined);

    const result = await rotateKey('old-pass', 'new-pass');

    expect(result.rotated).toEqual(['development', 'staging']);
    expect(result.failed).toEqual([]);
    expect(mockSaveEntry).toHaveBeenCalledTimes(2);
    expect(mockEncryptEnvFile).toHaveBeenCalledWith('KEY=value\nSECRET=abc', 'new-pass');
  });

  it('should rotate key for a specific environment', async () => {
    mockGetEntry.mockResolvedValue('encrypted-data');
    mockDecryptEnvFile.mockResolvedValue('KEY=value');
    mockEncryptEnvFile.mockResolvedValue('new-encrypted-data');
    mockSaveEntry.mockResolvedValue(undefined);

    const result = await rotateKey('old-pass', 'new-pass', { environment: 'staging' });

    expect(result.rotated).toEqual(['staging']);
    expect(mockListEntries).not.toHaveBeenCalled();
  });

  it('should add to failed list when entry is missing', async () => {
    mockListEntries.mockResolvedValue(['production']);
    mockGetEntry.mockResolvedValue(null);

    const result = await rotateKey('old-pass', 'new-pass');

    expect(result.rotated).toEqual([]);
    expect(result.failed).toEqual(['production']);
  });

  it('should handle decryption errors gracefully', async () => {
    mockListEntries.mockResolvedValue(['development']);
    mockGetEntry.mockResolvedValue('corrupted-data');
    mockDecryptEnvFile.mockRejectedValue(new Error('Decryption failed'));

    const result = await rotateKey('wrong-pass', 'new-pass');

    expect(result.rotated).toEqual([]);
    expect(result.failed).toEqual(['development']);
  });
});
