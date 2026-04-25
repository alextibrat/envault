import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadConfig,
  saveConfig,
  configExists,
  getConfigPath,
  EnvaultConfig,
} from './envaultConfig';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-config-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('returns default config when no file exists', () => {
    const config = loadConfig(tmpDir);
    expect(config.backend).toBe('file');
    expect(config.defaultEnv).toBe('development');
    expect(config.version).toBe(1);
  });

  it('merges file config with defaults', () => {
    const partial = { defaultEnv: 'production', backend: 's3' };
    fs.writeFileSync(getConfigPath(tmpDir), JSON.stringify(partial), 'utf-8');
    const config = loadConfig(tmpDir);
    expect(config.defaultEnv).toBe('production');
    expect(config.backend).toBe('s3');
    expect(config.encryptionAlgorithm).toBe('aes-256-gcm');
  });

  it('throws on invalid JSON', () => {
    fs.writeFileSync(getConfigPath(tmpDir), '{ invalid json }', 'utf-8');
    expect(() => loadConfig(tmpDir)).toThrow('Failed to parse config');
  });
});

describe('saveConfig', () => {
  it('writes config to disk', () => {
    saveConfig({ defaultEnv: 'staging' }, tmpDir);
    expect(configExists(tmpDir)).toBe(true);
    const config = loadConfig(tmpDir);
    expect(config.defaultEnv).toBe('staging');
  });

  it('merges with existing config', () => {
    saveConfig({ defaultEnv: 'staging' }, tmpDir);
    saveConfig({ backend: 'gcs' }, tmpDir);
    const config = loadConfig(tmpDir);
    expect(config.defaultEnv).toBe('staging');
    expect(config.backend).toBe('gcs');
  });
});

describe('configExists', () => {
  it('returns false when no config file', () => {
    expect(configExists(tmpDir)).toBe(false);
  });

  it('returns true after saving config', () => {
    saveConfig({}, tmpDir);
    expect(configExists(tmpDir)).toBe(true);
  });
});
