import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ProjectConfig } from './types';
import {
  generateFrontend,
  generateBackend,
  generateRootFiles,
  generateMonorepoConfig
} from './templates';

const ROOT_IGNORED_ENTRIES = new Set(['.git', '.gitignore', '.DS_Store', 'Thumbs.db']);

export async function generateProject(config: ProjectConfig): Promise<void> {
  const projectPath =
    config.projectLayout === 'root'
      ? path.resolve(process.cwd())
      : path.resolve(process.cwd(), config.projectName);

  if (config.projectLayout === 'folder') {
    if (await fs.pathExists(projectPath)) {
      throw new Error(`Directory ${config.projectName} already exists`);
    }
  } else {
    const entries = await fs.readdir(projectPath);
    const significantEntries = entries.filter((entry) => !ROOT_IGNORED_ENTRIES.has(entry));
    if (significantEntries.length > 0) {
      throw new Error(
        'Current directory is not empty. Choose subfolder layout or run the CLI from an empty directory.'
      );
    }
  }

  console.log(chalk.blue(`\n📁 Creating project structure...`));
  await fs.ensureDir(projectPath);

  await generateMonorepoConfig(projectPath, config);

  console.log(chalk.blue(`\n🎨 Generating frontend (${config.frontend})...`));
  await generateFrontend(projectPath, config);

  console.log(chalk.blue(`\n⚙️  Generating backend (${config.backend})...`));
  await generateBackend(projectPath, config);

  console.log(chalk.blue(`\n📄 Generating root configuration files...`));
  await generateRootFiles(projectPath, config);

  console.log(chalk.blue(`\n🔧 Initializing git repository...`));
  await initializeGit(projectPath);

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
