import path from 'path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateNextJS } from '../../src/templates/frontend/nextjs';
import { generateReact } from '../../src/templates/frontend/react';
import { generateHTML } from '../../src/templates/frontend/html';
import { createBaseConfig, createTempDir, fileExists } from '../helpers/fixtures';

describe('frontend generators', () => {
  let frontendPath: string;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    frontendPath = path.join(tempDir, 'frontend');
    await fs.ensureDir(frontendPath);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('generates a nextjs frontend scaffold', async () => {
    await generateNextJS(frontendPath, createBaseConfig({ frontend: 'nextjs' }));
    expect(await fileExists(path.join(frontendPath, 'package.json'))).toBe(true);
  });

  it('generates a react frontend scaffold', async () => {
    await generateReact(frontendPath, createBaseConfig({ frontend: 'react' }));
    expect(await fileExists(path.join(frontendPath, 'package.json'))).toBe(true);
  });

  it('generates an html frontend scaffold', async () => {
    await generateHTML(frontendPath, createBaseConfig({ frontend: 'html' }));
    expect(await fileExists(path.join(frontendPath, 'package.json'))).toBe(true);
  });
});
