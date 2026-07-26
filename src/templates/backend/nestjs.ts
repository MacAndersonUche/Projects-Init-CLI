import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateNestJS(backendPath: string, config: ProjectConfig): Promise<void> {
  const dependencies: Record<string, string> = {
    '@nestjs/common': '^10.4.8',
    '@nestjs/core': '^10.4.8',
    '@nestjs/platform-express': '^10.4.8',
    '@nestjs/testing': '^10.4.8',
    'reflect-metadata': '^0.2.2',
    'rxjs': '^7.8.1'
  };

  const devDependencies: Record<string, string> = {
    '@nestjs/cli': '^10.4.5',
    '@nestjs/schematics': '^10.1.1',
    '@types/express': '^5.0.0',
    '@types/node': '^22.7.5',
    'source-map-support': '^0.5.21',
    'ts-loader': '^9.5.1',
    'ts-node': '^10.9.2',
    'tsconfig-paths': '^4.2.0',
    typescript: '^5.6.3'
  };

  // Add database dependencies
  if (config.storage === 'local-json') {
    // No additional dependencies needed for JSON file storage
  } else if (config.storage === 'local-mongodb') {
    dependencies['@nestjs/mongoose'] = '^10.1.0';
    dependencies['mongoose'] = '^8.8.4';
  } else if (config.storage === 'local-sqlite') {
    if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
      dependencies['@prisma/client'] = '^6.0.1';
      dependencies['prisma'] = '^6.0.1';
    } else if (config.databaseType === 'sql' && config.sqlOption === 'sequelize') {
      dependencies['@nestjs/sequelize'] = '^10.0.1';
      dependencies['sequelize'] = '^6.37.5';
      dependencies['sequelize-typescript'] = '^2.1.6';
      dependencies['better-sqlite3'] = '^11.7.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.9';
    } else if (config.databaseType === 'sql') {
      dependencies['typeorm'] = '^0.3.20';
      dependencies['better-sqlite3'] = '^11.7.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.9';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies['@nestjs/mongoose'] = '^10.1.0';
      dependencies['mongoose'] = '^8.8.4';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies['@aws-sdk/client-dynamodb'] = '^3.699.0';
      dependencies['@aws-sdk/lib-dynamodb'] = '^3.699.0';
    }
  } else if (config.storage === 'external-url') {
    if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
      dependencies['@prisma/client'] = '^6.0.1';
      dependencies['prisma'] = '^6.0.1';
    } else if (config.databaseType === 'sql' && config.sqlOption === 'sequelize') {
      dependencies['@nestjs/sequelize'] = '^10.0.1';
      dependencies['sequelize'] = '^6.37.5';
      dependencies['sequelize-typescript'] = '^2.1.6';
      dependencies['pg'] = '^8.13.1';
      dependencies['pg-hstore'] = '^2.3.4';
      devDependencies['@types/pg'] = '^8.11.10';
    } else if (config.databaseType === 'sql') {
      dependencies['typeorm'] = '^0.3.20';
      dependencies['pg'] = '^8.13.1';
      devDependencies['@types/pg'] = '^8.11.10';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies['@nestjs/mongoose'] = '^10.1.0';
      dependencies['mongoose'] = '^8.8.4';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies['@aws-sdk/client-dynamodb'] = '^3.699.0';
      dependencies['@aws-sdk/lib-dynamodb'] = '^3.699.0';
    }
  }

  // Add API type dependencies
  if (config.apiType === 'graphql') {
    dependencies['@nestjs/graphql'] = '^12.1.0';
    dependencies['@nestjs/apollo'] = '^12.1.0';
    dependencies['apollo-server-express'] = '^3.12.1';
    dependencies['graphql'] = '^16.9.0';
  }

  const packageJson = {
    name: `${config.projectName}-backend`,
    version: '1.0.0',
    description: '',
    author: '',
    private: true,
    license: 'MIT',
    scripts: {
      build: 'nest build',
      format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:debug': 'nest start --debug --watch',
      'start:prod': 'node dist/main',
      lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage',
      'test:e2e': 'vitest --config vitest.e2e.config.ts'
    },
    dependencies,
    devDependencies: {
      ...devDependencies,
      '@typescript-eslint/eslint-plugin': '^8.15.0',
      '@typescript-eslint/parser': '^8.15.0',
      eslint: '^9.15.0',
      'eslint-config-prettier': '^9.1.0',
      'eslint-plugin-prettier': '^6.0.0',
      prettier: '^3.3.3',
      'vitest': '^2.1.3',
      '@vitest/ui': '^2.1.3',
      '@vitest/coverage-v8': '^2.1.3'
    }
  };

  await fs.writeJSON(path.join(backendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create nest-cli.json
  const nestCli = {
    '$schema': 'https://json.schemastore.org/nest-cli',
    collection: '@nestjs/schematics',
    sourceRoot: 'src',
    compilerOptions: {
      deleteOutDir: true
    }
  };

  await fs.writeJSON(path.join(backendPath, 'nest-cli.json'), nestCli, { spaces: 2 });

  // Create tsconfig
  const tsconfig = {
    compilerOptions: {
      module: 'commonjs',
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: 'ES2021',
      sourceMap: true,
      outDir: './dist',
      baseUrl: './',
      incremental: true,
      skipLibCheck: true,
      strictNullChecks: false,
      noImplicitAny: false,
      strictBindCallApply: false,
      forceConsistentCasingInFileNames: false,
      noFallthroughCasesInSwitch: false
    }
  };

  await fs.writeJSON(path.join(backendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // Create src directory structure
  const srcPath = path.join(backendPath, 'src');
  await fs.ensureDir(srcPath);

  // Create main.ts
  let mainContent = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3001);
  console.log(\`Application is running on: http://localhost:\${process.env.PORT || 3001}\`);
}
bootstrap();
`;

  await fs.writeFile(path.join(srcPath, 'main.ts'), mainContent);

  // Create app.module.ts
  let appModuleContent = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
`;

  if (config.apiType === 'graphql') {
    appModuleContent += `import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

`;
  }

  appModuleContent += `
@Module({
  imports: [
`;

  if (config.apiType === 'graphql') {
    appModuleContent += `    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
`;
  }

  appModuleContent += `  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

  await fs.writeFile(path.join(srcPath, 'app.module.ts'), appModuleContent);

  // Create app.controller.ts
  const appController = `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', message: 'Server is running' };
  }
}
`;

  await fs.writeFile(path.join(srcPath, 'app.controller.ts'), appController);

  // Create app.service.ts
  const appService = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
`;

  await fs.writeFile(path.join(srcPath, 'app.service.ts'), appService);

  // Create .env.example
  let envExample = `PORT=3001
`;

  if (config.storage === 'external-url' && config.databaseUrl) {
    envExample += `DATABASE_URL=${config.databaseUrl}\n`;
  } else if (config.storage === 'local-mongodb') {
    envExample += `DATABASE_URL=mongodb://localhost:27017/${config.projectName}\n`;
  }

  await fs.writeFile(path.join(backendPath, '.env.example'), envExample);

  // Create Vitest config
  const vitestConfig = `import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`;

  await fs.writeFile(path.join(backendPath, 'vitest.config.ts'), vitestConfig);

  // Create test files
  const testPath = path.join(srcPath, '__tests__');
  await fs.ensureDir(testPath);

  const appControllerTest = `import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from '../app.controller'
import { AppService } from '../app.service'

describe('AppController', () => {
  let appController: AppController
  let appService: AppService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appService = moduleRef.get<AppService>(AppService)
    appController = moduleRef.get<AppController>(AppController)
  })

  it('should return "Hello World!"', () => {
    expect(appController.getHello()).toBe('Hello World!')
  })

  it('should return health check', () => {
    const result = appController.getHealth()
    expect(result.status).toBe('ok')
  })
})
`;

  await fs.writeFile(path.join(testPath, 'app.controller.spec.ts'), appControllerTest);

  const appServiceTest = `import { describe, it, expect } from 'vitest'
import { AppService } from '../app.service'

describe('AppService', () => {
  it('should return "Hello World!"', () => {
    const appService = new AppService()
    expect(appService.getHello()).toBe('Hello World!')
  })
})
`;

  await fs.writeFile(path.join(testPath, 'app.service.spec.ts'), appServiceTest);

  // Create database setup if needed
  if (config.storage === 'local-json') {
    await generateJSONFileModule(srcPath, config);
  } else if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
    await generatePrismaConfig(backendPath, config);
  } else if (config.databaseType === 'sql' && config.sqlOption === 'sequelize') {
    await generateSequelizeModule(srcPath, config);
  } else if (
    config.databaseType === 'nosql' &&
    config.nosqlOption === 'mongodb'
  ) {
    await generateMongoDBModule(srcPath, config);
  } else if (config.storage === 'local-mongodb') {
    await generateMongoDBModule(srcPath, config);
  }

  // Create deployment files
  await generateBackendDeployment(backendPath, config);
}

async function generatePrismaConfig(backendPath: string, config: ProjectConfig): Promise<void> {
  const prismaPath = path.join(backendPath, 'prisma');
  await fs.ensureDir(prismaPath);

  let datasource = '';
  if (config.storage === 'local-sqlite') {
    datasource = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;
  } else if (config.storage === 'external-url') {
    datasource = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;
  }

  const schema = `${datasource}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  await fs.writeFile(path.join(prismaPath, 'schema.prisma'), schema);
}

async function generateSequelizeModule(srcPath: string, config: ProjectConfig): Promise<void> {
  const isSqlite = config.storage === 'local-sqlite';
  const dbContent = isSqlite
    ? `import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: 'database.sqlite',
      autoLoadModels: true,
      synchronize: true,
    }),
    SequelizeModule.forFeature([User]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
`
    : `import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: process.env.DATABASE_URL,
      autoLoadModels: true,
      synchronize: true,
    }),
    SequelizeModule.forFeature([User]),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
`;

  await fs.writeFile(path.join(srcPath, 'database.module.ts'), dbContent);

  const modelsPath = path.join(srcPath, 'models');
  await fs.ensureDir(modelsPath);

  const userModel = `import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column(DataType.STRING)
  name: string;
}
`;

  await fs.writeFile(path.join(modelsPath, 'user.model.ts'), userModel);
}

async function generateMongoDBModule(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbContent = `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb://localhost:27017/${config.projectName}'),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
`;

  await fs.writeFile(path.join(srcPath, 'database.module.ts'), dbContent);

  const schemasPath = path.join(srcPath, 'schemas');
  await fs.ensureDir(schemasPath);

  const userSchema = `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
`;

  await fs.writeFile(path.join(schemasPath, 'user.schema.ts'), userSchema);
}

async function generateJSONFileModule(srcPath: string, config: ProjectConfig): Promise<void> {
  const backendPath = path.dirname(path.dirname(srcPath));
  
  // Create JSON service
  const jsonService = `import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

@Injectable()
export class JsonDatabaseService {
  private ensureDataDir(): void {
    const dataDir = path.dirname(DB_FILE);
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(DB_FILE)) {
      fs.writeJSONSync(DB_FILE, { users: [] }, { spaces: 2 });
    }
  }

  private readDB(): any {
    this.ensureDataDir();
    try {
      return fs.readJSONSync(DB_FILE);
    } catch (error) {
      console.error('Error reading database:', error);
      return { users: [] };
    }
  }

  private writeDB(data: any): void {
    try {
      fs.writeJSONSync(DB_FILE, data, { spaces: 2 });
    } catch (error) {
      console.error('Error writing database:', error);
      throw error;
    }
  }

  getUsers(): any[] {
    const db = this.readDB();
    return db.users || [];
  }

  addUser(user: any): any {
    const db = this.readDB();
    if (!db.users) db.users = [];
    const newUser = { ...user, id: db.users.length + 1, createdAt: new Date().toISOString() };
    db.users.push(newUser);
    this.writeDB(db);
    return newUser;
  }

  getUserById(id: number): any {
    const db = this.readDB();
    return db.users?.find((u: any) => u.id === id);
  }

  updateUser(id: number, updates: any): any {
    const db = this.readDB();
    const userIndex = db.users?.findIndex((u: any) => u.id === id);
    if (userIndex !== -1 && userIndex !== undefined) {
      db.users[userIndex] = { ...db.users[userIndex], ...updates, updatedAt: new Date().toISOString() };
      this.writeDB(db);
      return db.users[userIndex];
    }
    return null;
  }

  deleteUser(id: number): boolean {
    const db = this.readDB();
    db.users = db.users?.filter((u: any) => u.id !== id) || [];
    this.writeDB(db);
    return true;
  }
}
`;

  const servicesPath = path.join(srcPath, 'services');
  await fs.ensureDir(servicesPath);
  await fs.writeFile(path.join(servicesPath, 'json-database.service.ts'), jsonService);

  // Create initial data directory and file
  const dataPath = path.join(backendPath, 'data');
  await fs.ensureDir(dataPath);
  await fs.writeJSON(path.join(dataPath, 'database.json'), { users: [] }, { spaces: 2 });
}

async function generateBackendDeployment(backendPath: string, config: ProjectConfig): Promise<void> {
  // Render configuration
  const renderYaml = `services:
  - type: web
    name: ${config.projectName}-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
`;

  await fs.writeFile(path.join(backendPath, 'render.yaml'), renderYaml);
}

