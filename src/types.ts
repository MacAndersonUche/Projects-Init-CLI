export type FrontendFramework = 'nextjs' | 'react' | 'html';
export type BackendFramework = 'express' | 'nest' | 'fastapi' | 'cdk' | 'sam';
export type StorageType = 'cdk' | 'local-sqlite' | 'external-url';
export type DatabaseType = 'sql' | 'nosql';
export type SQLOption = 'raw-sql' | 'prisma';
export type NoSQLOption = 'dynamodb' | 'mongodb';
export type APIType = 'graphql' | 'rest';

export interface ProjectConfig {
  projectName: string;
  frontend: FrontendFramework;
  backend: BackendFramework;
  storage: StorageType;
  databaseType?: DatabaseType;
  sqlOption?: SQLOption;
  nosqlOption?: NoSQLOption;
  apiType?: APIType;
  databaseUrl?: string;
}

