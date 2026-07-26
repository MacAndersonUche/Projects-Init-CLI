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
export type TestSuite = 'unit' | 'integration' | 'e2e' | 'performance';
export type AugmentSection =
  | 'tests-unit'
  | 'tests-integration'
  | 'tests-e2e'
  | 'tests-performance'
  | 'openapi'
  | 'renovate'
  | 'cicd'
  | 'ecs'
  | 'docs'
  | 'frontend'
  | 'backend';

export const ALL_TEST_SUITES: TestSuite[] = ['unit', 'integration', 'e2e', 'performance'];

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
  /** Which test suites to scaffold. Defaults to all when omitted. */
  testSuites?: TestSuite[];
}

export interface AugmentOptions {
  projectPath: string;
  sections: AugmentSection[];
  packageManager?: PackageManager;
  frontend?: FrontendFramework;
  backend?: BackendFramework;
  apiType?: APIType;
  deploymentStrategy?: DeploymentStrategy;
}
