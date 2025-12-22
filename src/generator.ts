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

export async function generateProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.resolve(process.cwd(), config.projectName);

  // Check if directory exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory ${config.projectName} already exists`);
  }

  console.log(chalk.blue(`\n📁 Creating project structure...`));
  await fs.ensureDir(projectPath);

  // Generate monorepo structure
  await generateMonorepoConfig(projectPath, config);
  
  // Generate frontend
  console.log(chalk.blue(`\n🎨 Generating frontend (${config.frontend})...`));
  await generateFrontend(projectPath, config);

  // Generate backend
  console.log(chalk.blue(`\n⚙️  Generating backend (${config.backend})...`));
  await generateBackend(projectPath, config);

  // Generate root files
  console.log(chalk.blue(`\n📄 Generating root configuration files...`));
  await generateRootFiles(projectPath, config);

  // Initialize git repository
  console.log(chalk.blue(`\n🔧 Initializing git repository...`));
  await initializeGit(projectPath);

  console.log(chalk.green(`\n✨ Project structure created at: ${projectPath}`));
}

async function initializeGit(projectPath: string): Promise<void> {
  const { execSync } = require('child_process');
  
  try {
    // Initialize git repository
    execSync('git init', { cwd: projectPath, stdio: 'pipe' });
    
    // Create initial commit
    execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { 
      cwd: projectPath, 
      stdio: 'pipe',
      env: { ...process.env, GIT_AUTHOR_NAME: 'Projects Init CLI', GIT_AUTHOR_EMAIL: 'cli@projects-init.dev' }
    });
    console.log(chalk.green('✓ Git repository initialized with initial commit'));
  } catch (error: any) {
    // Git might not be installed or there might be an issue, but don't fail the whole process
    if (error.message && error.message.includes('not a git repository')) {
      // Already initialized or other git issue
      console.log(chalk.yellow('⚠️  Git initialization skipped'));
    } else {
      console.log(chalk.yellow('⚠️  Git initialization skipped (git may not be installed)'));
    }
  }
}

