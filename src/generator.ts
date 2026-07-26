import fs from 'fs-extra';
import chalk from 'chalk';
import { ProjectConfig } from './types';
import {
  generateFrontend,
  generateBackend,
  generateRootFiles,
  generateMonorepoConfig
} from './templates';
import { assertScaffoldTarget, resolveProjectPath } from './utils/paths';

export async function generateProject(config: ProjectConfig): Promise<void> {
  const projectPath = resolveProjectPath(config.projectName, config.projectLayout);

  await assertScaffoldTarget(projectPath, config.projectName, config.projectLayout);

  console.log(chalk.blue(`\n📁 Creating project structure...`));
  await fs.ensureDir(projectPath);

  await generateMonorepoConfig(projectPath, config);

  console.log(chalk.blue(`\n🎨 Generating frontend (${config.frontend})...`));
  await generateFrontend(projectPath, config);

  console.log(chalk.blue(`\n⚙️  Generating backend (${config.backend})...`));
  await generateBackend(projectPath, config);

  console.log(chalk.blue(`\n📄 Generating root configuration files...`));
  await generateRootFiles(projectPath, config);

  if (process.env.PROJECTS_INIT_SKIP_GIT !== '1') {
    console.log(chalk.blue(`\n🔧 Initializing git repository...`));
    await initializeGit(projectPath);
  }

  console.log(chalk.green(`\n✨ Project structure created at: ${projectPath}`));
}

async function initializeGit(projectPath: string): Promise<void> {
  const { execSync } = require('child_process');

  try {
    execSync('git init', { cwd: projectPath, stdio: 'pipe' });
    execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', {
      cwd: projectPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Projects Init CLI',
        GIT_AUTHOR_EMAIL: 'cli@projects-init.dev'
      }
    });
    console.log(chalk.green('✓ Git repository initialized with initial commit'));
  } catch (error: any) {
    if (error.message && error.message.includes('not a git repository')) {
      console.log(chalk.yellow('⚠️  Git initialization skipped'));
    } else {
      console.log(chalk.yellow('⚠️  Git initialization skipped (git may not be installed)'));
    }
  }
}

export { resolveProjectPath, assertScaffoldTarget } from './utils/paths';
