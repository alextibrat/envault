import { receiveEnv } from './receive';
import * as fileStore from '../storage/fileStore';
import * as cryptoIndex from '../crypto';
import * as envaultConfig from '../config/envaultConfig';
import * as fs from 'fs';

jest.mock('../storage/fileStore');
jest.mock('../crypto');
jest.mock('../config/envaultConfig');
jest.mock('fs');

const mockConfig = { vault: '.envault', secret: 'test-secret' };
const mockPayload = {
  environment: 'staging',
  format: 'env',
  ciphertext: 'encrypted-share',
  sharedAt: '2024-01-01T00:00:00.000Z',
  version: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
  (fs.existsSync as jest.Mock).mockReturnValue(true);
  (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockPayload));
  (cryptoIndex.decryptEnvFile as jest.Mock).mockResolvedValue('KEY=value');
  (cryptoIndex.encryptEnvFile as jest.Mock).mockResolvedValue('re-encrypted');
  (fileStore.saveEntry as jest.Mock).mockResolvedValue(undefined);
});

test('receiveEnv saves decrypted env into vault', async () => {
  await receiveEnv({ filePath: '/tmp/staging.share' });
  expect(cryptoIndex.decryptEnvFile).toHaveBeenCalledWith('encrypted-share', 'test-secret');
  expect(fileStore.saveEntry).toHaveBeenCalledWith('.envault', 'staging', 're-encrypted', false);
});

test('receiveEnv uses recipientKey for decryption', async () => {
  await receiveEnv({ filePath: '/tmp/staging.share', recipientKey: 'other-key' });
  expect(cryptoIndex.decryptEnvFile).toHaveBeenCalledWith('encrypted-share', 'other-key');
});

test('receiveEnv throws if share file not found', async () => {
  (fs.existsSync as jest.Mock).mockReturnValue(false);
  await expect(receiveEnv({ filePath: '/tmp/missing.share' })).rejects.toThrow('Share file not found');
});

test('receiveEnv throws if share file is invalid JSON', async () => {
  (fs.readFileSync as jest.Mock).mockReturnValue('not-json');
  await expect(receiveEnv({ filePath: '/tmp/bad.share' })).rejects.toThrow('Invalid share file format');
});

test('receiveEnv throws if config missing', async () => {
  (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(null);
  await expect(receiveEnv({ filePath: '/tmp/staging.share' })).rejects.toThrow('No envault config');
});
