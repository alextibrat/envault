import { parseEnvContent, computeDiff, diffCommand } from './diff';
import * as fileStore from '../storage/fileStore';
import * as crypto from '../crypto/index';
import * as envaultConfig from '../config/envaultConfig';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../storage/fileStore');
jest.mock('../crypto/index');
jest.mock('../config/envaultConfig');
jest.mock('fs');

describe('parseEnvContent', () => {
  it('parses key=value pairs', () => {
    const result = parseEnvContent('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and empty lines', () => {
    const result = parseEnvContent('# comment\n\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('handles values with equals signs', () => {
    const result = parseEnvContent('TOKEN=abc=def');
    expect(result).toEqual({ TOKEN: 'abc=def' });
  });
});

describe('computeDiff', () => {
  it('detects added keys', () => {
    const diff = computeDiff({}, { NEW_KEY: 'value' });
    expect(diff.added).toContain('NEW_KEY');
  });

  it('detects removed keys', () => {
    const diff = computeDiff({ OLD_KEY: 'value' }, {});
    expect(diff.removed).toContain('OLD_KEY');
  });

  it('detects changed keys', () => {
    const diff = computeDiff({ KEY: 'old' }, { KEY: 'new' });
    expect(diff.changed).toContain('KEY');
  });

  it('detects unchanged keys', () => {
    const diff = computeDiff({ KEY: 'same' }, { KEY: 'same' });
    expect(diff.unchanged).toContain('KEY');
  });
});

describe('diffCommand', () => {
  it('throws if config is missing', async () => {
    (envaultConfig.loadConfig as jest.Mock).mockResolvedValue(null);
    await expect(diffCommand('development', '.env', 'pass')).rejects.toThrow('No envault config');
  });

  it('throws if no remote entry found', async () => {
    (envaultConfig.loadConfig as jest.Mock).mockResolvedValue({ project: 'myapp' });
    (fileStore.getEntry as jest.Mock).mockResolvedValue(null);
    await expect(diffCommand('development', '.env', 'pass')).rejects.toThrow('No remote entry');
  });

  it('returns diff result for valid inputs', async () => {
    (envaultConfig.loadConfig as jest.Mock).mockResolvedValue({ project: 'myapp' });
    (fileStore.getEntry as jest.Mock).mockResolvedValue({ encryptedData: 'enc' });
    (crypto.decryptEnvFile as jest.Mock).mockResolvedValue('REMOTE_KEY=remote');
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('LOCAL_KEY=local');
    const result = await diffCommand('development', '.env', 'pass');
    expect(result.added).toContain('LOCAL_KEY');
    expect(result.removed).toContain('REMOTE_KEY');
  });
});
