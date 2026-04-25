import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { saveEntry, getEntry, listEntries, deleteEntry } from './fileStore';

const TEST_VAULT_PATH = path.join(os.homedir(), '.envault', 'vault.json');

function cleanVault(): void {
  if (fs.existsSync(TEST_VAULT_PATH)) {
    fs.unlinkSync(TEST_VAULT_PATH);
  }
}

const mockEntryData = {
  encryptedData: 'abc123encryptedpayload',
  iv: 'deadbeefiv',
  salt: 'cafebabe',
};

describe('fileStore', () => {
  beforeEach(() => {
    cleanVault();
  });

  afterAll(() => {
    cleanVault();
  });

  test('saveEntry creates a new entry with version 1', () => {
    const entry = saveEntry('my-project', mockEntryData);
    expect(entry.project).toBe('my-project');
    expect(entry.version).toBe(1);
    expect(entry.encryptedData).toBe(mockEntryData.encryptedData);
    expect(entry.createdAt).toBe(entry.updatedAt);
  });

  test('saveEntry increments version on update', () => {
    saveEntry('my-project', mockEntryData);
    const updated = saveEntry('my-project', { ...mockEntryData, encryptedData: 'newpayload' });
    expect(updated.version).toBe(2);
    expect(updated.encryptedData).toBe('newpayload');
  });

  test('getEntry returns null for unknown project', () => {
    const result = getEntry('nonexistent');
    expect(result).toBeNull();
  });

  test('getEntry returns saved entry', () => {
    saveEntry('project-a', mockEntryData);
    const entry = getEntry('project-a');
    expect(entry).not.toBeNull();
    expect(entry?.project).toBe('project-a');
  });

  test('listEntries returns all saved entries', () => {
    saveEntry('proj-1', mockEntryData);
    saveEntry('proj-2', mockEntryData);
    const entries = listEntries();
    expect(entries.length).toBe(2);
    expect(entries.map(e => e.project)).toContain('proj-1');
    expect(entries.map(e => e.project)).toContain('proj-2');
  });

  test('deleteEntry removes an existing entry', () => {
    saveEntry('to-delete', mockEntryData);
    const result = deleteEntry('to-delete');
    expect(result).toBe(true);
    expect(getEntry('to-delete')).toBeNull();
  });

  test('deleteEntry returns false for nonexistent project', () => {
    const result = deleteEntry('ghost-project');
    expect(result).toBe(false);
  });
});
