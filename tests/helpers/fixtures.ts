import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { ProjectConfig } from '../../src/types';

export function createBaseConfig(
  overrides: Partial<ProjectConfig> = {}
): ProjectConfig {
  return {
    projectName: 'test-app',
    projectLayout: 'folder',
    frontend: 'react',
    backend: 'express',
    storage: 'local-json',
    apiType: 'rest',
    ...overrides,
  };
}

export async function createTempDir(prefix = 'projects-init-'): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function withTempCwd<T>(
  fn: (cwd: string) => Promise<T>
): Promise<T> {
  const cwd = await createTempDir();
  const previous = process.cwd();
  try {
    process.chdir(cwd);
    return await fn(cwd);
  } finally {
    process.chdir(previous);
    await fs.remove(cwd);
  }
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
  return fs.readJSON(filePath) as Promise<T>;
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}
