import * as fs from 'fs';
import * as path from 'path';
import { pushCommand } from './push';
import { pullCommand } from './pull';
import { saveConfig } from '../config/envaultConfig';

const TEST_DIR = path.join(__dirname, '../../tmp/pull-test');
const VAULT_DIR = path.join(TEST_DIR, '.envault');
const ENV_FILE = path.join(TEST_DIR, '.env');
const ORIGINAL_CONTENT = 'API_KEY=abc\nSECRET=xyz\n';

beforeAll(async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.writeFileSync(ENV_FILE, ORIGINAL_CONTENT, 'utf-8');
  const origCwd = process.cwd();
  process.chdir(TEST_DIR);
  try {
    await saveConfig({ vaultDir: VAULT_DIR, defaultEnv: '.env', passphrase: 'pullpass' });
    await pushCommand();
  } finally {
    process.chdir(origCwd);
  }
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('pullCommand', () => {
  it('decrypts vault entry and writes to output file', async () => {
    const outputPath = path.join(TEST_DIR, '.env.pulled');
    const origCwd = process.cwd();
    process.chdir(TEST_DIR);
    try {
      await pullCommand({ output: '.env.pulled' });
      const result = fs.readFileSync(outputPath, 'utf-8');
      expect(result).toBe(ORIGINAL_CONTENT);
    } finally {
      process.chdir(origCwd);
    }
  });

  it('throws if no vault entry exists for key', async () => {
    const origCwd = process.cwd();
    process.chdir(TEST_DIR);
    try {
      await expect(pullCommand({ env: '.env.missing' })).rejects.toThrow('No vault entry found');
    } finally {
      process.chdir(origCwd);
    }
  });
});
