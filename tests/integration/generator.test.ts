import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateProject } from '../../src/generator';
import { createBaseConfig, createTempDir, fileExists } from '../helpers/fixtures';

describe('generateProject integration', () => {
  let tempDir: string;
  let previousCwd: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    previousCwd = process.cwd();
    process.chdir(tempDir);
    process.env.PROJECTS_INIT_SKIP_GIT = '1';
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    delete process.env.PROJECTS_INIT_SKIP_GIT;
    await fs.remove(tempDir);
  });

  it('scaffolds a full monorepo into a subfolder', async () => {
    const config = createBaseConfig({
      projectName: 'folder-app',
      projectLayout: 'folder',
      frontend: 'react',
      backend: 'express',
      storage: 'local-mongodb',
      databaseType: 'nosql',
      nosqlOption: 'mongodb',
      apiType: 'rest',
    });

    await generateProject(config);

    const root = path.join(tempDir, 'folder-app');
    expect(await fileExists(path.join(root, 'package.json'))).toBe(true);
    expect(await fileExists(path.join(root, 'frontend', 'package.json'))).toBe(true);
    expect(await fileExists(path.join(root, 'backend', 'package.json'))).toBe(true);
    expect(await fileExists(path.join(root, 'backend', 'src', 'db.ts'))).toBe(true);
    expect(await fileExists(path.join(root, 'README.md'))).toBe(true);
  });

  it('scaffolds into the current directory for root layout', async () => {
    const config = createBaseConfig({
      projectName: 'root-app',
      projectLayout: 'root',
      frontend: 'html',
      backend: 'express',
      storage: 'local-sqlite',
      databaseType: 'sql',
      sqlOption: 'sequelize',
      apiType: 'rest',
    });

    await generateProject(config);

    expect(await fileExists(path.join(tempDir, 'package.json'))).toBe(true);
    expect(await fileExists(path.join(tempDir, 'frontend', 'package.json'))).toBe(true);
    expect(await fileExists(path.join(tempDir, 'backend', 'src', 'db.ts'))).toBe(true);

    const db = await fs.readFile(path.join(tempDir, 'backend', 'src', 'db.ts'), 'utf8');
    expect(db).toContain('sequelize');
  });

  it('fails when folder already exists', async () => {
    await fs.ensureDir(path.join(tempDir, 'taken'));

    await expect(
      generateProject(
        createBaseConfig({
          projectName: 'taken',
          projectLayout: 'folder',
        })
      )
    ).rejects.toThrow('Directory taken already exists');
  });

  it('fails when root directory is not empty', async () => {
    await fs.writeFile(path.join(tempDir, 'notes.txt'), 'occupied');

    await expect(
      generateProject(
        createBaseConfig({
          projectName: 'root-app',
          projectLayout: 'root',
        })
      )
    ).rejects.toThrow('Current directory is not empty');
  });

  it('allows root layout when only .git is present', async () => {
    await fs.ensureDir(path.join(tempDir, '.git'));

    await generateProject(
      createBaseConfig({
        projectName: 'git-root',
        projectLayout: 'root',
        storage: 'local-json',
      })
    );

    expect(await fileExists(path.join(tempDir, 'package.json'))).toBe(true);
  });
});
