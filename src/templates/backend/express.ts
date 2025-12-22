import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateExpress(backendPath: string, config: ProjectConfig): Promise<void> {
  const dependencies: Record<string, string> = {
    express: '^4.18.2',
    cors: '^2.8.5',
    dotenv: '^16.3.1'
  };

  const devDependencies: Record<string, string> = {
    '@types/express': '^4.17.21',
    '@types/cors': '^2.8.17',
    '@types/node': '^20.10.6',
    typescript: '^5.3.3',
    'ts-node': '^10.9.2',
    nodemon: '^3.0.2',
    'vitest': '^1.1.0',
    '@vitest/ui': '^1.1.0',
    'supertest': '^6.3.3',
    '@types/supertest': '^6.0.2',
    '@vitest/coverage-v8': '^1.1.0'
  };

  // Add database dependencies
  if (config.storage === 'local-sqlite') {
    if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
      dependencies['@prisma/client'] = '^5.7.1';
      devDependencies['prisma'] = '^5.7.1';
    } else if (config.databaseType === 'sql') {
      dependencies['better-sqlite3'] = '^9.2.2';
      devDependencies['@types/better-sqlite3'] = '^7.6.8';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies['mongoose'] = '^8.0.3';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies['@aws-sdk/client-dynamodb'] = '^3.490.0';
      dependencies['@aws-sdk/lib-dynamodb'] = '^3.490.0';
    }
  } else if (config.storage === 'external-url') {
    if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
      dependencies['@prisma/client'] = '^5.7.1';
      devDependencies['prisma'] = '^5.7.1';
    } else if (config.databaseType === 'sql') {
      dependencies['pg'] = '^8.11.3';
      devDependencies['@types/pg'] = '^8.10.9';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies['mongoose'] = '^8.0.3';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies['@aws-sdk/client-dynamodb'] = '^3.490.0';
      dependencies['@aws-sdk/lib-dynamodb'] = '^3.490.0';
    }
  }

  // Add API type dependencies
  if (config.apiType === 'graphql') {
    dependencies['graphql'] = '^16.8.1';
    dependencies['express-graphql'] = '^0.12.0';
    devDependencies['@types/express-graphql'] = '^0.12.0';
  }

  const packageJson = {
    name: `${config.projectName}-backend`,
    version: '1.0.0',
    main: 'dist/index.js',
    scripts: {
      dev: 'nodemon --exec ts-node src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage'
    },
    dependencies,
    devDependencies
  };

  await fs.writeJSON(path.join(backendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create TypeScript config
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: 'node'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };

  await fs.writeJSON(path.join(backendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // Create Vitest config
  const vitestConfig = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
`;

  await fs.writeFile(path.join(backendPath, 'vitest.config.ts'), vitestConfig);

  // Create src directory
  const srcPath = path.join(backendPath, 'src');
  await fs.ensureDir(srcPath);

  // Create index.ts
  let indexContent = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

`;

  if (config.apiType === 'graphql') {
    indexContent += `import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

// GraphQL schema
const schema = buildSchema(\`
  type Query {
    hello: String
  }
\`);

// Root resolver
const root = {
  hello: () => 'Hello from GraphQL!',
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

`;
  } else {
    indexContent += `// REST API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the REST API' });
});

`;
  }

  indexContent += `const server = app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});

export default app;
`;

  await fs.writeFile(path.join(srcPath, 'index.ts'), indexContent);

  // Create .env.example
  let envExample = `PORT=3001
`;

  if (config.storage === 'external-url' && config.databaseUrl) {
    envExample += `DATABASE_URL=${config.databaseUrl}\n`;
  }

  await fs.writeFile(path.join(backendPath, '.env.example'), envExample);

  // Create database setup if needed
  if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
    await generatePrismaConfig(backendPath, config);
  } else if (config.databaseType === 'sql' && config.storage === 'local-sqlite') {
    await generateSQLiteSetup(srcPath, config);
  } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
    await generateMongoDBSetup(srcPath, config);
  } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
    await generateDynamoDBSetup(srcPath, config);
  }

  // Create test files
  const testPath = path.join(srcPath, '__tests__');
  await fs.ensureDir(testPath);

  const testFile = `import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../index'

describe('API Tests', () => {
  it('should return health check', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

${config.apiType === 'rest' ? `  it('should return API welcome message', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('REST API')
  })` : `  it('should handle GraphQL query', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({ query: '{ hello }' })
    expect(res.status).toBe(200)
    expect(res.body.data.hello).toBe('Hello from GraphQL!')
  })`}
})
`;

  await fs.writeFile(path.join(testPath, 'api.test.ts'), testFile);
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

async function generateSQLiteSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbContent = `import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.db');
const db = new Database(dbPath);

// Initialize database
db.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
\`);

export default db;
`;

  await fs.writeFile(path.join(srcPath, 'db.ts'), dbContent);
}

async function generateMongoDBSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbContent = `import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.DATABASE_URL || 'mongodb://localhost:27017/${config.projectName}';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User schema example
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export default connectDB;
`;

  await fs.writeFile(path.join(srcPath, 'db.ts'), dbContent);
}

async function generateDynamoDBSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbContent = `import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client);

export default docClient;
`;

  await fs.writeFile(path.join(srcPath, 'db.ts'), dbContent);
}

