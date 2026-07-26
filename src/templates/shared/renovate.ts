import fs from 'fs-extra';
import path from 'path';

export async function writeRenovateConfig(projectPath: string): Promise<void> {
  const renovate = {
    $schema: 'https://docs.renovatebot.com/renovate-schema.json',
    extends: [
      'config:recommended',
      ':dependencyDashboard',
      ':semanticCommits',
      'group:monorepos',
    ],
    timezone: 'UTC',
    schedule: ['before 6am on monday'],
    rangeStrategy: 'bump',
    packageRules: [
      {
        matchManagers: ['npm'],
        matchUpdateTypes: ['minor', 'patch'],
        groupName: 'npm minor/patch',
      },
      {
        matchDepTypes: ['devDependencies'],
        matchUpdateTypes: ['patch'],
        groupName: 'dev patch',
      },
    ],
    npm: {
      fileMatch: [
        '(^|/)package.json$',
        '(^|/)backend/package.json$',
        '(^|/)frontend/package.json$',
      ],
    },
  };

  await fs.writeJSON(path.join(projectPath, 'renovate.json'), renovate, { spaces: 2 });
}
