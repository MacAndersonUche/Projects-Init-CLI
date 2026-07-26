import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateExpress } from '../../src/templates/backend/express';
import { createBaseConfig, createTempDir, readJson, fileExists } from '../helpers/fixtures';

describe('generateExpress', () => {
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

  it('creates core express files', async () => {
    await generateExpress(backendPath, createBaseConfig());

    expect(await fileExists(path.join(backendPath, 'package.json'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'tsconfig.json'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', 'index.ts'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'vitest.config.ts'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', '__tests__', 'api.test.ts'))).toBe(true);
  });

  it('adds prisma dependencies and schema for prisma + sqlite', async () => {
    await generateExpress(
      backendPath,
      createBaseConfig({
        storage: 'local-sqlite',
        databaseType: 'sql',
        sqlOption: 'prisma',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string>; devDependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies['@prisma/client']).toBeDefined();
    expect(pkg.devDependencies.prisma).toBeDefined();
    expect(await fileExists(path.join(backendPath, 'prisma', 'schema.prisma'))).toBe(true);

    const schema = await fs.readFile(path.join(backendPath, 'prisma', 'schema.prisma'), 'utf8');
    expect(schema).toContain('provider = "sqlite"');
  });

  it('adds sequelize + sqlite dependencies and db setup', async () => {
    await generateExpress(
      backendPath,
      createBaseConfig({
        storage: 'local-sqlite',
        databaseType: 'sql',
        sqlOption: 'sequelize',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies.sequelize).toBeDefined();
    expect(pkg.dependencies['better-sqlite3']).toBeDefined();

    const db = await fs.readFile(path.join(backendPath, 'src', 'db.ts'), 'utf8');
    expect(db).toContain("dialect: 'sqlite'");
    expect(db).toContain('initDatabase');
  });

  it('adds sequelize + postgres dependencies for external url', async () => {
    await generateExpress(
      backendPath,
      createBaseConfig({
        storage: 'external-url',
        databaseType: 'sql',
        sqlOption: 'sequelize',
        databaseUrl: 'postgres://localhost:5432/app',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies.sequelize).toBeDefined();
    expect(pkg.dependencies.pg).toBeDefined();

    const db = await fs.readFile(path.join(backendPath, 'src', 'db.ts'), 'utf8');
    expect(db).toContain("dialect: 'postgres'");
  });

  it('adds mongoose for local mongodb storage', async () => {
    await generateExpress(
      backendPath,
      createBaseConfig({
        storage: 'local-mongodb',
        databaseType: 'nosql',
        nosqlOption: 'mongodb',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies.mongoose).toBeDefined();

    const env = await fs.readFile(path.join(backendPath, '.env.example'), 'utf8');
    expect(env).toContain('mongodb://localhost:27017/');

    const db = await fs.readFile(path.join(backendPath, 'src', 'db.ts'), 'utf8');
    expect(db).toContain('mongoose.connect');
  });

  it('adds mongoose for external mongodb', async () => {
    await generateExpress(
      backendPath,
      createBaseConfig({
        storage: 'external-url',
        databaseType: 'nosql',
        nosqlOption: 'mongodb',
        databaseUrl: 'mongodb://localhost:27017/custom',
      })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies.mongoose).toBeDefined();

    const env = await fs.readFile(path.join(backendPath, '.env.example'), 'utf8');
    expect(env).toContain('mongodb://localhost:27017/custom');
  });

  it('adds graphql dependencies when apiType is graphql', async () => {
    await generateExpress(
      backendPath,
      createBaseConfig({ apiType: 'graphql' })
    );

    const pkg = await readJson<{ dependencies: Record<string, string> }>(
      path.join(backendPath, 'package.json')
    );
    expect(pkg.dependencies.graphql).toBeDefined();
    expect(pkg.dependencies['express-graphql']).toBeDefined();

    const index = await fs.readFile(path.join(backendPath, 'src', 'index.ts'), 'utf8');
    expect(index).toContain('/graphql');
  });

  it('creates json file storage helpers', async () => {
    await generateExpress(backendPath, createBaseConfig({ storage: 'local-json' }));

    expect(await fileExists(path.join(backendPath, 'src', 'db.ts'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'data', 'database.json'))).toBe(true);
  });
});
