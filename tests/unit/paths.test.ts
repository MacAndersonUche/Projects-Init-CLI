import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveProjectPath,
  assertScaffoldTarget,
  ROOT_IGNORED_ENTRIES,
} from '../../src/utils/paths';
import { createTempDir } from '../helpers/fixtures';

describe('resolveProjectPath', () => {
  it('resolves a subfolder path for folder layout', () => {
    const result = resolveProjectPath('my-app', 'folder', '/workspace');
    expect(result).toBe(path.resolve('/workspace', 'my-app'));
  });

  it('resolves to cwd for root layout', () => {
    const result = resolveProjectPath('my-app', 'root', '/workspace');
    expect(result).toBe(path.resolve('/workspace'));
  });
});

describe('assertScaffoldTarget', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('allows folder layout when the target does not exist', async () => {
    await expect(
      assertScaffoldTarget(path.join(tempDir, 'new-app'), 'new-app', 'folder')
    ).resolves.toBeUndefined();
  });

  it('rejects folder layout when the target already exists', async () => {
    const target = path.join(tempDir, 'existing');
    await fs.ensureDir(target);

    await expect(
      assertScaffoldTarget(target, 'existing', 'folder')
    ).rejects.toThrow('Directory existing already exists');
  });

  it('allows root layout when directory only has ignored entries', async () => {
    await fs.ensureDir(path.join(tempDir, '.git'));
    await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules\n');

    await expect(
      assertScaffoldTarget(tempDir, 'root-app', 'root')
    ).resolves.toBeUndefined();
  });

  it('rejects root layout when directory has significant files', async () => {
    await fs.writeFile(path.join(tempDir, 'README.md'), '# hi');

    await expect(
      assertScaffoldTarget(tempDir, 'root-app', 'root')
    ).rejects.toThrow('Current directory is not empty');
  });

  it('exposes expected ignored entries', () => {
    expect(ROOT_IGNORED_ENTRIES.has('.git')).toBe(true);
    expect(ROOT_IGNORED_ENTRIES.has('.gitignore')).toBe(true);
    expect(ROOT_IGNORED_ENTRIES.has('README.md')).toBe(false);
  });
});
