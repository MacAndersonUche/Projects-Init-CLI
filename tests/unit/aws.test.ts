import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateCDK } from '../../src/templates/backend/cdk';
import { generateSAM } from '../../src/templates/backend/sam';
import { createBaseConfig, createTempDir, fileExists } from '../helpers/fixtures';

describe('aws generators', () => {
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

  it('generates a CDK backend scaffold', async () => {
    await generateCDK(
      backendPath,
      createBaseConfig({
        backend: 'cdk',
        storage: 'cdk',
        databaseType: 'sql',
      })
    );

    expect(await fileExists(path.join(backendPath, 'package.json'))).toBe(true);
  });

  it('generates a SAM backend scaffold', async () => {
    await generateSAM(
      backendPath,
      createBaseConfig({
        backend: 'sam',
        storage: 'cdk',
        databaseType: 'nosql',
      })
    );

    expect(await fileExists(path.join(backendPath, 'template.yaml'))).toBe(true);
  });
});
