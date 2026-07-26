import inquirer from 'inquirer';
import { ProjectConfig, DatabaseType } from './types';
import { getDefaultProjectName, validateProjectName } from './utils/project-name';
import { validateDatabaseUrl } from './utils/validate';
import { defaultMongoUrl } from './templates/shared/project-docs';

export async function promptUser(): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectLayout',
      message: 'Where should the project be created?',
      choices: [
        { name: 'In a new subfolder (recommended)', value: 'folder' },
        { name: 'In the current directory (root)', value: 'root' }
      ]
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: getDefaultProjectName(),
      validate: validateProjectName
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Select package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'Yarn (Classic v1)', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' }
      ]
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
        { name: 'MongoDB', value: 'mongodb' },
        { name: 'Local JSON file', value: 'local-json' },
        { name: 'External database URL (SQL / Postgres / etc.)', value: 'external-url' }
      ]
    }
  ]);

  const config: ProjectConfig = {
    projectName: answers.projectName,
    projectLayout: answers.projectLayout,
    packageManager: answers.packageManager,
    frontend: answers.frontend,
    backend: answers.backend,
    storage: answers.storage
  };

  if (config.storage === 'mongodb') {
    config.databaseType = 'nosql';
    config.nosqlOption = 'mongodb';

    const mongoAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'mongodbConnection',
        message: 'How will MongoDB be connected?',
        choices: [
          { name: 'Local MongoDB (localhost)', value: 'local' },
          { name: 'External / Atlas / hosted URL', value: 'external' }
        ]
      }
    ]);
    config.mongodbConnection = mongoAnswer.mongodbConnection;

    if (config.mongodbConnection === 'external') {
      const urlAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'databaseUrl',
          message: 'Enter MongoDB connection URL:',
          default: 'mongodb+srv://user:password@cluster.mongodb.net/dbname',
          validate: validateDatabaseUrl
        }
      ]);
      config.databaseUrl = urlAnswer.databaseUrl;
    } else {
      config.databaseUrl = defaultMongoUrl(config.projectName);
    }
  }

  if (config.storage === 'external-url') {
    const urlAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'databaseUrl',
        message: 'Enter database connection URL:',
        validate: validateDatabaseUrl
      }
    ]);
    config.databaseUrl = urlAnswer.databaseUrl;
  }

  if (
    config.backend !== 'cdk' &&
    config.backend !== 'sam' &&
    config.storage !== 'cdk' &&
    config.storage !== 'local-json' &&
    config.storage !== 'mongodb'
  ) {
    const dbTypeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'databaseType',
        message: 'Select database type:',
        choices: [
          { name: 'SQL', value: 'sql' },
          { name: 'MongoDB', value: 'nosql' },
          { name: 'DynamoDB', value: 'nosql-dynamo' }
        ]
      }
    ]);

    if (dbTypeAnswer.databaseType === 'nosql-dynamo') {
      config.databaseType = 'nosql';
      config.nosqlOption = 'dynamodb';
    } else if (dbTypeAnswer.databaseType === 'nosql') {
      config.databaseType = 'nosql';
      config.nosqlOption = 'mongodb';
    } else {
      config.databaseType = dbTypeAnswer.databaseType as DatabaseType;
    }

    if (config.databaseType === 'sql') {
      const sqlAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'sqlOption',
          message: 'Select SQL ORM:',
          choices: [
            { name: 'Raw SQL', value: 'raw-sql' },
            { name: 'Prisma ORM', value: 'prisma' },
            { name: 'Sequelize ORM', value: 'sequelize' }
          ]
        }
      ]);
      config.sqlOption = sqlAnswer.sqlOption;
    }
  } else if (config.storage === 'local-sqlite') {
    const sqlAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'sqlOption',
        message: 'Select SQL ORM:',
        choices: [
          { name: 'Raw SQL', value: 'raw-sql' },
          { name: 'Prisma ORM', value: 'prisma' },
          { name: 'Sequelize ORM', value: 'sequelize' }
        ]
      }
    ]);
    config.databaseType = 'sql';
    config.sqlOption = sqlAnswer.sqlOption;
  } else if (config.storage === 'cdk') {
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

  if (config.backend === 'express' || config.backend === 'nest' || config.backend === 'fastapi') {
    const deployAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'deploymentStrategy',
        message: 'Select backend deployment strategy:',
        choices: [
          { name: 'Render / PaaS (render.yaml)', value: 'render' },
          { name: 'AWS ECS (Docker + Fargate)', value: 'ecs' }
        ]
      }
    ]);
    config.deploymentStrategy = deployAnswer.deploymentStrategy;
  }

  return config;
}

export { getDefaultProjectName, validateProjectName } from './utils/project-name';
export { validateDatabaseUrl } from './utils/validate';
