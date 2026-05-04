import * as fs from 'fs';
import * as path from 'path';
import { saveSnapshot, loadSnapshot } from './snapshot';
import { createSnapshot } from '../utils/envSnapshot';

const SNAPSHOT_DIR = '.envault/snapshots';
const PROJECT = 'test-project';
const ENV = 'staging';

function cleanSnapshots() {
  const filePath = path.join(SNAPSHOT_DIR, `${PROJECT}__${ENV}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

beforeEach(cleanSnapshots);
afterAll(cleanSnapshots);

describe('saveSnapshot / loadSnapshot', () => {
  const sampleContent = 'FOO=bar\nBAZ=qux';

  it('saves and loads a snapshot correctly', () => {
    const snap = createSnapshot(sampleContent);
    saveSnapshot(PROJECT, ENV, snap);
    const loaded = loadSnapshot(PROJECT, ENV);
    expect(loaded).not.toBeNull();
    expect(loaded!.hash).toBe(snap.hash);
    expect(loaded!.keyCount).toBe(snap.keyCount);
    expect(loaded!.keys).toEqual(snap.keys);
  });

  it('returns null when no snapshot exists', () => {
    const result = loadSnapshot('nonexistent', 'prod');
    expect(result).toBeNull();
  });

  it('overwrites an existing snapshot', () => {
    const snap1 = createSnapshot('FOO=bar');
    saveSnapshot(PROJECT, ENV, snap1);

    const snap2 = createSnapshot('FOO=updated\nNEW=value');
    saveSnapshot(PROJECT, ENV, snap2);

    const loaded = loadSnapshot(PROJECT, ENV);
    expect(loaded!.hash).toBe(snap2.hash);
    expect(loaded!.keyCount).toBe(2);
  });

  it('persists keys in sorted order', () => {
    const snap = createSnapshot('ZEBRA=1\nAPPLE=2\nMIDDLE=3');
    saveSnapshot(PROJECT, ENV, snap);
    const loaded = loadSnapshot(PROJECT, ENV);
    expect(loaded!.keys).toEqual(['APPLE', 'MIDDLE', 'ZEBRA']);
  });
});
