import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectExistingProject } from '../../src/utils/detect';
import { createTempDir } from '../helpers/fixtures';

describe('detectExistingProject', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('throws when package.json is missing', async () => {
    await expect(detectExistingProject(tempDir)).rejects.toThrow(/No package.json/);
  });

  it('reports missing sections for a bare monorepo root', async () => {
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'demo',
      private: true,
      workspaces: ['frontend', 'backend'],
    });

    const info = await detectExistingProject(tempDir);
    expect(info.projectName).toBe('demo');
    expect(info.missingSections).toContain('frontend');
    expect(info.missingSections).toContain('backend');
    expect(info.missingSections).toContain('renovate');
    expect(info.missingSections).toContain('tests-unit');
  });

  it('detects present frontend and renovate', async () => {
    await fs.writeJSON(path.join(tempDir, 'package.json'), { name: 'demo' });
    await fs.ensureDir(path.join(tempDir, 'frontend'));
    await fs.writeJSON(path.join(tempDir, 'renovate.json'), {});

    const info = await detectExistingProject(tempDir);
    expect(info.hasFrontend).toBe(true);
    expect(info.hasRenovate).toBe(true);
    expect(info.missingSections).not.toContain('frontend');
    expect(info.missingSections).not.toContain('renovate');
  });
});
