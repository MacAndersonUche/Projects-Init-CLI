import { ProjectConfig } from '../types';
import { generateNextJS } from './frontend/nextjs';
import { generateReact } from './frontend/react';
import { generateHTML } from './frontend/html';
import { generateExpress } from './backend/express';
import { generateNestJS } from './backend/nestjs';
import { generateFastAPI } from './backend/fastapi';
import { generateCDK } from './backend/cdk';
import { generateSAM } from './backend/sam';
import fs from 'fs-extra';
import path from 'path';

export async function generateFrontend(projectPath: string, config: ProjectConfig): Promise<void> {
  const frontendPath = path.join(projectPath, 'frontend');
  await fs.ensureDir(frontendPath);

  switch (config.frontend) {
    case 'nextjs':
      await generateNextJS(frontendPath, config);
      break;
    case 'react':
      await generateReact(frontendPath, config);
      break;
    case 'html':
      await generateHTML(frontendPath, config);
      break;
  }
}

export async function generateBackend(projectPath: string, config: ProjectConfig): Promise<void> {
  const backendPath = path.join(projectPath, 'backend');
  await fs.ensureDir(backendPath);

  switch (config.backend) {
    case 'express':
      await generateExpress(backendPath, config);
      break;
    case 'nest':
      await generateNestJS(backendPath, config);
      break;
    case 'fastapi':
      await generateFastAPI(backendPath, config);
      break;
    case 'cdk':
      await generateCDK(backendPath, config);
      break;
    case 'sam':
      await generateSAM(backendPath, config);
      break;
  }
}

export async function generateMonorepoConfig(projectPath: string, config: ProjectConfig): Promise<void> {
  const rootPackageJson = {
    name: config.projectName,
    version: '1.0.0',
    private: true,
    workspaces: ['frontend', 'backend'],
    scripts: {
      dev: 'concurrently "npm run dev --workspace=frontend" "npm run dev --workspace=backend"',
      build: 'npm run build --workspaces',
      install: 'npm install --workspaces'
    },
    devDependencies: {
      concurrently: '^8.2.2'
    }
  };

  await fs.writeJSON(path.join(projectPath, 'package.json'), rootPackageJson, { spaces: 2 });
}

export async function generateRootFiles(projectPath: string, config: ProjectConfig): Promise<void> {
  // Generate README
  const readme = `# ${config.projectName}

## Project Structure

This is a monorepo project with the following structure:

- \`frontend/\` - ${config.frontend === 'nextjs' ? 'Next.js' : config.frontend === 'react' ? 'React' : 'HTML'} application with Tailwind CSS
- \`backend/\` - ${config.backend === 'express' ? 'Express.js' : config.backend === 'nest' ? 'NestJS' : config.backend === 'fastapi' ? 'FastAPI' : config.backend === 'cdk' ? 'AWS CDK' : 'AWS SAM'} backend

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development servers:
   \`\`\`bash
   npm run dev
   \`\`\`

## Tech Stack

- Frontend: ${config.frontend === 'nextjs' ? 'Next.js' : config.frontend === 'react' ? 'React' : 'HTML'} + Tailwind CSS
- Backend: ${config.backend === 'express' ? 'Express.js' : config.backend === 'nest' ? 'NestJS' : config.backend === 'fastapi' ? 'FastAPI' : config.backend === 'cdk' ? 'AWS CDK' : 'AWS SAM'}
- Storage: ${config.storage === 'cdk' ? 'CDK Database' : config.storage === 'local-sqlite' ? 'Local SQLite' : 'External Database'}
${config.databaseType ? `- Database: ${config.databaseType === 'sql' ? 'SQL' : 'NoSQL'}` : ''}
${config.apiType ? `- API: ${config.apiType === 'rest' ? 'REST' : 'GraphQL'}` : ''}
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);

  // Generate .gitignore
  const gitignore = `node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
.idea/
.vscode/
*.pyc
__pycache__/
.venv/
venv/
cdk.out/
.sam/
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // Generate CI/CD workflows
  await generateCICD(projectPath, config);
}

async function generateCICD(projectPath: string, config: ProjectConfig): Promise<void> {
  const workflowsPath = path.join(projectPath, '.github', 'workflows');
  await fs.ensureDir(workflowsPath);

  // Main CI workflow
  const ciWorkflow = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run frontend tests
      run: npm run test --workspace=frontend
      continue-on-error: ${config.frontend === 'html' ? 'true' : 'false'}

    - name: Run backend tests
      run: npm run test --workspace=backend
      continue-on-error: ${config.backend === 'fastapi' || config.backend === 'cdk' || config.backend === 'sam' ? 'true' : 'false'}

    - name: Build frontend
      run: npm run build --workspace=frontend
      continue-on-error: ${config.frontend === 'html' ? 'true' : 'false'}

    - name: Build backend
      run: npm run build --workspace=backend
      continue-on-error: ${config.backend === 'fastapi' || config.backend === 'cdk' || config.backend === 'sam' ? 'true' : 'false'}

  lint:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint --workspaces --if-present
      continue-on-error: true
`;

  await fs.writeFile(path.join(workflowsPath, 'ci.yml'), ciWorkflow);

  // Deployment workflow
  const deployWorkflow = `name: Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build project
      run: npm run build --workspaces --if-present

    - name: Deploy Frontend
      run: |
        echo "Add your frontend deployment steps here"
        # Example for Vercel:
        # npm install -g vercel
        # vercel --prod --token \${{ secrets.VERCEL_TOKEN }}
      continue-on-error: true

    - name: Deploy Backend
      run: |
        echo "Add your backend deployment steps here"
        # Example for Railway/Render:
        # Add deployment commands based on your backend choice
      continue-on-error: true
`;

  await fs.writeFile(path.join(workflowsPath, 'deploy.yml'), deployWorkflow);
}

