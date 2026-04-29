import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseJsonToEnv, parseYamlToEnv, detectFormat, importCommand } from './import';
import * as fileStore from '../storage/fileStore';
import * as crypto from '../crypto';
import * as config from '../config/envaultConfig';
import * as fs from 'fs';

vi.mock('../storage/fileStore');
vi.mock('../crypto');
vi.mock('../config/envaultConfig');
vi.mock('fs');

describe('parseJsonToEnv', () => {
  it('converts JSON object to env format', () => {
    const json = JSON.stringify({ API_KEY: 'abc123', PORT: '3000' });
    const result = parseJsonToEnv(json);
    expect(result).toContain('API_KEY=abc123');
    expect(result).toContain('PORT=3000');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonToEnv('not json')).toThrow();
  });
});

describe('parseYamlToEnv', () => {
  it('converts YAML to env format', () => {
    const yaml = `API_KEY: abc123\nPORT: '3000'`;
    const result = parseYamlToEnv(yaml);
    expect(result).toContain('API_KEY=abc123');
    expect(result).toContain('PORT=3000');
  });
});

describe('detectFormat', () => {
  it('detects json format', () => expect(detectFormat('file.json')).toBe('json'));
  it('detects yaml format', () => expect(detectFormat('file.yaml')).toBe('yaml'));
  it('detects yml format', () => expect(detectFormat('file.yml')).toBe('yaml'));
  it('defaults to env format', () => expect(detectFormat('.env')).toBe('env'));
});

describe('importCommand', () => {
  beforeEach(() => {
    vi.mocked(config.loadConfig).mockReturnValue({ passphrase: 'secret', vaultDir: '.vault' } as any);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('KEY=value\n' as any);
    vi.mocked(crypto.encryptEnvFile).mockResolvedValue('encrypted-data');
    vi.mocked(fileStore.saveEntry).mockResolvedValue(undefined);
  });

  it('imports an env file successfully', async () => {
    await importCommand('.env', 'production');
    expect(fileStore.saveEntry).toHaveBeenCalledWith('production', 'encrypted-data');
  });

  it('throws if file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    await expect(importCommand('missing.env', 'staging')).rejects.toThrow('File not found');
  });

  it('throws if no passphrase is available', async () => {
    vi.mocked(config.loadConfig).mockReturnValue({ vaultDir: '.vault' } as any);
    await expect(importCommand('.env', 'dev')).rejects.toThrow('Passphrase is required');
  });

  it('imports a json file with format detection', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ A: '1' }) as any);
    await importCommand('vars.json', 'staging');
    expect(crypto.encryptEnvFile).toHaveBeenCalledWith('A=1', 'secret');
  });
});
