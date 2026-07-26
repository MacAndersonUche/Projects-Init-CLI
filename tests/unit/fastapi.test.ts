import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateFastAPI } from '../../src/templates/backend/fastapi';
import { createBaseConfig, createTempDir, fileExists } from '../helpers/fixtures';

describe('generateFastAPI', () => {
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

  it('creates core fastapi files', async () => {
    await generateFastAPI(
      backendPath,
      createBaseConfig({ backend: 'fastapi' })
    );

    expect(await fileExists(path.join(backendPath, 'requirements.txt'))).toBe(true);
    expect(await fileExists(path.join(backendPath, 'src', 'main.py'))).toBe(true);
    expect(await fileExists(path.join(backendPath, '.env.example'))).toBe(true);
  });

  it('adds mongodb deps for local mongodb storage', async () => {
    await generateFastAPI(
      backendPath,
      createBaseConfig({
        backend: 'fastapi',
        storage: 'local-mongodb',
        databaseType: 'nosql',
        nosqlOption: 'mongodb',
      })
    );

    const requirements = await fs.readFile(
      path.join(backendPath, 'requirements.txt'),
      'utf8'
    );
    expect(requirements).toContain('motor');
    expect(requirements).toContain('pymongo');

    const env = await fs.readFile(path.join(backendPath, '.env.example'), 'utf8');
    expect(env).toContain('mongodb://localhost:27017/');
  });

  it('adds sqlalchemy for sqlite sql storage', async () => {
    await generateFastAPI(
      backendPath,
      createBaseConfig({
        backend: 'fastapi',
        storage: 'local-sqlite',
        databaseType: 'sql',
      })
    );

    const requirements = await fs.readFile(
      path.join(backendPath, 'requirements.txt'),
      'utf8'
    );
    expect(requirements).toContain('sqlalchemy');
  });
});
