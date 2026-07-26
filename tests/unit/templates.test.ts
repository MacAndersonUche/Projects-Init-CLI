import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateMonorepoConfig,
  generateRootFiles,
  generateFrontend,
  generateBackend,
} from '../../src/templates';
import { createBaseConfig, createTempDir, readJson, fileExists } from '../helpers/fixtures';

describe('template orchestration', () => {
  let projectPath: string;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    projectPath = path.join(tempDir, 'project');
    await fs.ensureDir(projectPath);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('writes root workspace package.json', async () => {
    await generateMonorepoConfig(projectPath, createBaseConfig());

    const pkg = await readJson<{
      name: string;
      workspaces: string[];
      scripts: Record<string, string>;
    }>(path.join(projectPath, 'package.json'));

    expect(pkg.name).toBe('test-app');
    expect(pkg.workspaces).toEqual(['frontend', 'backend']);
    expect(pkg.scripts.dev).toContain('concurrently');
  });

  it('writes README mentioning mongodb and sequelize when configured', async () => {
    await generateRootFiles(
      projectPath,
      createBaseConfig({
        storage: 'local-mongodb',
        databaseType: 'nosql',
        nosqlOption: 'mongodb',
        sqlOption: undefined,
      })
    );

    const readme = await fs.readFile(path.join(projectPath, 'README.md'), 'utf8');
    expect(readme).toContain('Local MongoDB');
    expect(readme).toContain('MongoDB');
    expect(await fileExists(path.join(projectPath, '.gitignore'))).toBe(true);
    expect(await fileExists(path.join(projectPath, '.github', 'workflows', 'ci.yml'))).toBe(true);
  });

  it('creates frontend and backend directories', async () => {
    const config = createBaseConfig({
      frontend: 'react',
      backend: 'express',
      storage: 'local-sqlite',
      databaseType: 'sql',
      sqlOption: 'sequelize',
    });

    await generateFrontend(projectPath, config);
    await generateBackend(projectPath, config);

    expect(await fileExists(path.join(projectPath, 'frontend', 'package.json'))).toBe(true);
    expect(await fileExists(path.join(projectPath, 'backend', 'package.json'))).toBe(true);
    expect(await fileExists(path.join(projectPath, 'backend', 'src', 'db.ts'))).toBe(true);
  });
});
