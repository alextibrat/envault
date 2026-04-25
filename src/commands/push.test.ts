import * as fs from 'fs';
import * as path from 'path';
import { pushCommand } from './push';
import { pullCommand } from './pull';
import { saveConfig } from '../config/envaultConfig';

const TEST_DIR = path.join(__dirname, '../../tmp/push-pull-test');
const VAULT_DIR = path.join(TEST_DIR, '.envault');
const ENV_FILE = path.join(TEST_DIR, '.env');

beforeAll(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.writeFileSync(ENV_FILE, 'API_KEY=secret123\nDB_URL=postgres://localhost/test\n', 'utf-8');
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('pushCommand', () => {
  it('throws if no config exists', async () => {
    const origCwd = process.cwd();
    process.chdir(TEST_DIR);
    try {
      await expect(pushCommand({ passphrase: 'test' })).rejects.toThrow('No envault config found');
    } finally {
      process.chdir(origCwd);
    }
  });

  it('encrypts and saves env file to vault', async () => {
    const origCwd = process.cwd();
    process.chdir(TEST_DIR);
    try {
      await saveConfig({ vaultDir: VAULT_DIR, defaultEnv: '.env', passphrase: 'strongpass' });
      await pushCommand();
      const entryPath = path.join(VAULT_DIR, '.env.vault');
      expect(fs.existsSync(entryPath)).toBe(true);
    } finally {
      process.chdir(origCwd);
    }
  });
});
