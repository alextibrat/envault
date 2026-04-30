import { shareEnv } from './share';
import * as fileStore from '../storage/fileStore';
import * as cryptoIndex from '../crypto';
import * as envaultConfig from '../config/envaultConfig';
import * as fs from 'fs';

jest.mock('../storage/fileStore');
jest.mock('../crypto');
jest.mock('../config/envaultConfig');
jest.mock('fs');

const mockConfig = { vault: '.envault', secret: 'test-secret' };
const mockEntry = { ciphertext: 'encrypted-data', version: 2 };

beforeEach(() => {
  jest.clearAllMocks();
  (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
  (fileStore.getEntry as jest.Mock).mockResolvedValue(mockEntry);
  (cryptoIndex.decryptEnvFile as jest.Mock).mockResolvedValue('KEY=value\nFOO=bar');
  (cryptoIndex.encryptEnvFile as jest.Mock).mockResolvedValue('re-encrypted');
  (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
});

test('shareEnv writes a share file to the output path', async () => {
  await shareEnv({ environment: 'staging', outputPath: '/tmp/staging.share' });
  expect(fileStore.getEntry).toHaveBeenCalledWith('.envault', 'staging');
  expect(cryptoIndex.decryptEnvFile).toHaveBeenCalledWith('encrypted-data', 'test-secret');
  expect(fs.writeFileSync).toHaveBeenCalled();
  const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
  const payload = JSON.parse(written);
  expect(payload.environment).toBe('staging');
  expect(payload.version).toBe(2);
});

test('shareEnv uses recipientKey when provided', async () => {
  await shareEnv({ environment: 'staging', outputPath: '/tmp/out', recipientKey: 'other-key' });
  expect(cryptoIndex.encryptEnvFile).toHaveBeenCalledWith(expect.any(String), 'other-key');
});

test('shareEnv throws if config is missing', async () => {
  (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(null);
  await expect(shareEnv({ environment: 'staging', outputPath: '/tmp/out' })).rejects.toThrow('No envault config');
});

test('shareEnv throws if environment not found', async () => {
  (fileStore.getEntry as jest.Mock).mockResolvedValue(null);
  await expect(shareEnv({ environment: 'missing', outputPath: '/tmp/out' })).rejects.toThrow("No environment 'missing'");
});

test('shareEnv writes JSON format when specified', async () => {
  await shareEnv({ environment: 'staging', outputPath: '/tmp/out', format: 'json' });
  const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
  const payload = JSON.parse(written);
  expect(payload.format).toBe('json');
});
