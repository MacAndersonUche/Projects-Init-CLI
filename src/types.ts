export type FrontendFramework = 'nextjs' | 'react' | 'html';
export type BackendFramework = 'express' | 'nest' | 'fastapi' | 'cdk' | 'sam';
export type StorageType = 'cdk' | 'local-sqlite' | 'local-mongodb' | 'local-json' | 'external-url';
export type DatabaseType = 'sql' | 'nosql';
export type SQLOption = 'raw-sql' | 'prisma' | 'sequelize';
export type NoSQLOption = 'dynamodb' | 'mongodb';
export type APIType = 'graphql' | 'rest';
export type ProjectLayout = 'folder' | 'root';

export interface ProjectConfig {
  projectName: string;
  projectLayout: ProjectLayout;
  frontend: FrontendFramework;
  backend: BackendFramework;
  storage: StorageType;
  databaseType?: DatabaseType;
  sqlOption?: SQLOption;
  nosqlOption?: NoSQLOption;
  apiType?: APIType;
  databaseUrl?: string;
}

