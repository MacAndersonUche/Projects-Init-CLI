import { ProjectConfig } from '../types';
import { generateNextJS, generateReact, generateHTML } from './frontend';
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
  let deployWorkflow = `name: Deploy

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --workspace=frontend

    - name: Build frontend
      run: npm run build --workspace=frontend

    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      env:
        NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
      with:
        args: deploy --dir=frontend/.next --prod
      continue-on-error: true

    - name: Deploy to Render
      run: |
        echo "Deploy to Render by connecting your GitHub repository"
        echo "Or use: render deploy --service=\${{ secrets.RENDER_SERVICE_ID }}"
      continue-on-error: true

  deploy-backend:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
`;

  // Add backend deployment steps based on backend type
  if (config.backend === 'cdk') {
    deployWorkflow += `
    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --workspace=backend

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ secrets.AWS_REGION || 'us-east-1' }}

    - name: Build CDK
      run: npm run build --workspace=backend

    - name: Deploy CDK Stack
      run: |
        cd backend
        npm run cdk deploy -- --require-approval never --all
`;
  } else if (config.backend === 'sam') {
    deployWorkflow += `
    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --workspace=backend

    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install SAM CLI
      run: |
        pip install aws-sam-cli

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ secrets.AWS_REGION || 'us-east-1' }}

    - name: Build SAM application
      run: |
        cd backend
        sam build

    - name: Deploy SAM application
      run: |
        cd backend
        sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
`;
  } else {
    deployWorkflow += `
    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci --workspace=backend

    - name: Build backend
      run: npm run build --workspace=backend

    - name: Deploy to Render
      run: |
        echo "Deploy to Render by connecting your GitHub repository"
        echo "Or use: render deploy --service=\${{ secrets.RENDER_SERVICE_ID }}"
      continue-on-error: true
`;
  }

  deployWorkflow += `\n`;

  await fs.writeFile(path.join(workflowsPath, 'deploy.yml'), deployWorkflow);
}

