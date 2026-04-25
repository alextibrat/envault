import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { initEnvault } from './init';
import { configExists, loadConfig } from '../config/envaultConfig';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-init-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('initEnvault', () => {
  it('creates config and vault directory on first run', async () => {
    await initEnvault({ cwd: tmpDir, nonInteractive: true });
    expect(configExists(tmpDir)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.envault'))).toBe(true);
  });

  it('uses provided backend and defaultEnv options', async () => {
    await initEnvault({
      cwd: tmpDir,
      nonInteractive: true,
      backend: 's3',
      defaultEnv: 'production',
    });
    const config = loadConfig(tmpDir);
    expect(config.backend).toBe('s3');
    expect(config.defaultEnv).toBe('production');
  });

  it('throws if already initialized without --force', async () => {
    await initEnvault({ cwd: tmpDir, nonInteractive: true });
    await expect(
      initEnvault({ cwd: tmpDir, nonInteractive: true })
    ).rejects.toThrow('already initialized');
  });

  it('reinitializes when --force is set', async () => {
    await initEnvault({ cwd: tmpDir, nonInteractive: true, backend: 'file' });
    await initEnvault({
      cwd: tmpDir,
      nonInteractive: true,
      force: true,
      backend: 'gcs',
      defaultEnv: 'staging',
    });
    const config = loadConfig(tmpDir);
    expect(config.backend).toBe('gcs');
    expect(config.defaultEnv).toBe('staging');
  });

  it('defaults to file backend and development env', async () => {
    await initEnvault({ cwd: tmpDir, nonInteractive: true });
    const config = loadConfig(tmpDir);
    expect(config.backend).toBe('file');
    expect(config.defaultEnv).toBe('development');
  });
});
