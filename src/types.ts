export type FrontendFramework = 'nextjs' | 'react' | 'html';
export type BackendFramework = 'express' | 'nest' | 'fastapi' | 'cdk' | 'sam';
export type StorageType = 'cdk' | 'local-sqlite' | 'mongodb' | 'local-json' | 'external-url';
export type DatabaseType = 'sql' | 'nosql';
export type SQLOption = 'raw-sql' | 'prisma' | 'sequelize';
export type NoSQLOption = 'dynamodb' | 'mongodb';
export type APIType = 'graphql' | 'rest';
export type ProjectLayout = 'folder' | 'root';
export type DeploymentStrategy = 'render' | 'ecs';
export type PackageManager = 'npm' | 'yarn' | 'pnpm';
export type MongoDBConnection = 'local' | 'external';

export interface ProjectConfig {
  projectName: string;
  projectLayout: ProjectLayout;
  packageManager: PackageManager;
  frontend: FrontendFramework;
  backend: BackendFramework;
  storage: StorageType;
  databaseType?: DatabaseType;
  sqlOption?: SQLOption;
  nosqlOption?: NoSQLOption;
  apiType?: APIType;
  deploymentStrategy?: DeploymentStrategy;
  mongodbConnection?: MongoDBConnection;
  databaseUrl?: string;
}

