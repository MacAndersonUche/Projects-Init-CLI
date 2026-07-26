import path from 'path';
import fs from 'fs-extra';
import { ProjectLayout } from '../types';

export const ROOT_IGNORED_ENTRIES = new Set([
  '.git',
  '.gitignore',
  '.DS_Store',
  'Thumbs.db',
]);

export function resolveProjectPath(
  projectName: string,
  projectLayout: ProjectLayout,
  cwd: string = process.cwd()
): string {
  if (projectLayout === 'root') {
    return path.resolve(cwd);
  }
  return path.resolve(cwd, projectName);
}

/**
 * Ensures the target path is usable for scaffolding.
 * Throws a descriptive Error when it is not.
 */
export async function assertScaffoldTarget(
  projectPath: string,
  projectName: string,
  projectLayout: ProjectLayout
): Promise<void> {
  if (projectLayout === 'folder') {
    if (await fs.pathExists(projectPath)) {
      throw new Error(`Directory ${projectName} already exists`);
    }
    return;
  }

  const entries = await fs.readdir(projectPath);
  const significantEntries = entries.filter(
    (entry) => !ROOT_IGNORED_ENTRIES.has(entry)
  );

  if (significantEntries.length > 0) {
    throw new Error(
      'Current directory is not empty. Choose subfolder layout or run the CLI from an empty directory.'
    );
  }
}
