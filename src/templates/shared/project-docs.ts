import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export function storageLabel(config: ProjectConfig): string {
  switch (config.storage) {
    case 'cdk':
      return 'CDK Database';
    case 'local-sqlite':
      return 'Local SQLite';
    case 'mongodb':
      return config.mongodbConnection === 'external'
        ? 'MongoDB (external / Atlas)'
        : 'MongoDB (local)';
    case 'local-json':
      return 'Local JSON file';
    case 'external-url':
      return 'External database URL';
    default:
      return config.storage;
  }
}

export function defaultMongoUrl(projectName: string): string {
  return `mongodb://localhost:27017/${projectName}`;
}

export async function writePnpmWorkspace(projectPath: string): Promise<void> {
  const content = `packages:
  - 'frontend'
  - 'backend'
`;
  await fs.writeFile(path.join(projectPath, 'pnpm-workspace.yaml'), content);
}
