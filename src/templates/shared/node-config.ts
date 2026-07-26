import fs from 'fs-extra';
import path from 'path';
import { NODE_ENGINES, RECOMMENDED_NODE } from './constants';

export function withEngines<T extends Record<string, unknown>>(pkg: T): T & { engines: typeof NODE_ENGINES } {
  return {
    ...pkg,
    engines: NODE_ENGINES,
  };
}

export async function writeNodeVersionFiles(projectPath: string): Promise<void> {
  await fs.writeFile(path.join(projectPath, '.nvmrc'), `${RECOMMENDED_NODE}\n`);
  await fs.writeFile(path.join(projectPath, '.node-version'), `${RECOMMENDED_NODE}\n`);
}
