import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateNestJS } from '../../src/templates/backend/nestjs';
import { createBaseConfig, createTempDir, readJson, fileExists } from '../helpers/fixtures';

describe('generateNestJS', () => {
  let backendPath: string;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    backendPath = path.join(tempDir, 'backend');
    await fs.ensureDir(backendPath);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('creates core nest files', async () => {
    await generateNestJS(
      backendPath,
      createBaseConfig({ backend: 'nest' })
    );

    expect(await fileExists(path.join(backendPath, 'package.json'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'nest-cli.json'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', 'main.ts'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', 'app.module.ts'))).toBe(true);
  });

  it('adds sequelize nest modules for sqlite', async () => {
    await generateNestJS(
      backendPath,
      createBaseConfig({
        backend: 'nest',
        storage: 'local-sqlite',
        databaseType: 'sql',
        sqlOption: 'sequelize',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies['@nestjs/sequelize']).toBeDefined();
    expect(pkg.dependencies.sequelize).toBeDefined();
    expect(await fileExists(path.join(backendPath, 'src', 'database.module.ts'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', 'models', 'user.model.ts'))).toBe(true);

    const module = await fs.readFile(
      path.join(backendPath, 'src', 'database.module.ts'),
      'utf8'
    );
    expect(module).toContain("dialect: 'sqlite'");
  });

  it('adds mongoose nest modules for local mongodb', async () => {
    await generateNestJS(
      backendPath,
      createBaseConfig({
        backend: 'nest',
        storage: 'mongodb',
        mongodbConnection: 'local',
        databaseUrl: 'mongodb://localhost:27017/test-app',
        databaseType: 'nosql',
        nosqlOption: 'mongodb',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies['@nestjs/mongoose']).toBeDefined();
    expect(pkg.dependencies.mongoose).toBeDefined();
    expect(await fileExists(path.join(backendPath, 'src', 'database.module.ts'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', 'schemas', 'user.schema.ts'))).toBe(true);
  });

  it('adds graphql nest dependencies', async () => {
    await generateNestJS(
      backendPath,
      createBaseConfig({
        backend: 'nest',
        apiType: 'graphql',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies['@nestjs/graphql']).toBeDefined();
    expect(pkg.dependencies['@nestjs/apollo']).toBeDefined();
  });
});
