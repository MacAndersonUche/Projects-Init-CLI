import path from 'path';
import inquirer from 'inquirer';
import { ProjectConfig, DatabaseType } from './types';

function getDefaultProjectName(): string {
  const folderName = path.basename(process.cwd());
  const sanitized = folderName
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitized || 'my-project';
}

export async function promptUser(): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: getDefaultProjectName(),
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Project name cannot be empty';
        }
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'frontend',
      message: 'Select frontend framework:',
      choices: [
        { name: 'Next.js (with Tailwind)', value: 'nextjs' },
        { name: 'React (with Tailwind)', value: 'react' },
        { name: 'HTML (with Tailwind)', value: 'html' }
      ]
    },
    {
      type: 'list',
      name: 'backend',
      message: 'Select backend framework:',
      choices: [
        { name: 'Express.js', value: 'express' },
        { name: 'NestJS', value: 'nest' },
        { name: 'FastAPI (Python)', value: 'fastapi' },
        { name: 'AWS CDK Deployment', value: 'cdk' },
        { name: 'AWS SAM Deployment', value: 'sam' }
      ]
    },
    {
      type: 'list',
      name: 'storage',
      message: 'Select storage option:',
      choices: [
        { name: 'CDK to create database', value: 'cdk' },
        { name: 'Local SQLite (Node.js)', value: 'local-sqlite' },
        { name: 'Local JSON file', value: 'local-json' },
        { name: 'External database URL', value: 'external-url' }
      ]
    }
  ]);

  const config: ProjectConfig = {
    projectName: answers.projectName,
    frontend: answers.frontend,
    backend: answers.backend,
    storage: answers.storage
  };

  // If storage is external-url, ask for database URL
  if (config.storage === 'external-url') {
    const urlAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'databaseUrl',
        message: 'Enter database connection URL:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Database URL cannot be empty';
          }
          return true;
        }
      }
    ]);
    config.databaseUrl = urlAnswer.databaseUrl;
  }

  // Ask for database type if backend is not CDK/SAM or storage is not CDK/local-json
  if (config.backend !== 'cdk' && config.backend !== 'sam' && config.storage !== 'cdk' && config.storage !== 'local-json') {
    const dbTypeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'databaseType',
        message: 'Select database type:',
        choices: [
          { name: 'SQL', value: 'sql' },
          { name: 'NoSQL', value: 'nosql' }
        ]
      }
    ]);
    config.databaseType = dbTypeAnswer.databaseType as DatabaseType;

    if (config.databaseType === 'sql') {
      const sqlAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'sqlOption',
          message: 'Select SQL option:',
          choices: [
            { name: 'Raw SQL', value: 'raw-sql' },
            { name: 'Prisma ORM', value: 'prisma' }
          ]
        }
      ]);
      config.sqlOption = sqlAnswer.sqlOption;
    } else {
      const nosqlAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'nosqlOption',
          message: 'Select NoSQL option:',
          choices: [
            { name: 'DynamoDB', value: 'dynamodb' },
            { name: 'MongoDB', value: 'mongodb' }
          ]
        }
      ]);
      config.nosqlOption = nosqlAnswer.nosqlOption;
    }
  } else if (config.storage === 'cdk') {
    // For CDK storage, still ask database type
    const dbTypeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'databaseType',
        message: 'Select database type for CDK:',
        choices: [
          { name: 'SQL (RDS)', value: 'sql' },
          { name: 'NoSQL (DynamoDB)', value: 'nosql' }
        ]
      }
    ]);
    config.databaseType = dbTypeAnswer.databaseType as DatabaseType;
  }

  // Ask for API type if backend is Express or NestJS
  if (config.backend === 'express' || config.backend === 'nest') {
    const apiAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'apiType',
        message: 'Select API type:',
        choices: [
          { name: 'REST API', value: 'rest' },
          { name: 'GraphQL', value: 'graphql' }
        ]
      }
    ]);
    config.apiType = apiAnswer.apiType;
  }

  return config;
}
