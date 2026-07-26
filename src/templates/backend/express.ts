import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';
import { BACKEND_PACKAGES } from '../shared/constants';
import { withEngines } from '../shared/node-config';
import { writeOpenApiSpec } from '../shared/openapi';
import { writeEcsDeploymentFiles } from '../shared/ecs';
import { defaultMongoUrl } from '../shared/project-docs';

export async function generateExpress(backendPath: string, config: ProjectConfig): Promise<void> {
  const dependencies: Record<string, string> = {
    express: '^4.21.1',
    cors: '^2.8.5',
    dotenv: '^16.4.5'
  };

  const devDependencies: Record<string, string> = {
    '@types/express': '^5.0.0',
    '@types/cors': '^2.8.17',
    '@types/node': '^22.7.5',
    typescript: '^5.6.3',
    'ts-node': '^10.9.2',
    nodemon: '^3.1.7',
    'vitest': BACKEND_PACKAGES.vitest,
    '@vitest/ui': BACKEND_PACKAGES['@vitest/ui'],
    '@vitest/coverage-v8': BACKEND_PACKAGES['@vitest/coverage-v8'],
    supertest: '^7.0.0',
    '@types/supertest': '^6.0.2'
  };

  // Add database dependencies
  if (config.storage === 'local-json') {
    // No additional dependencies needed for JSON file storage
  } else if (config.storage === 'mongodb') {
    dependencies['mongoose'] = '^8.8.4';
  } else if (config.storage === 'local-sqlite') {
    if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
      dependencies['@prisma/client'] = '^6.0.1';
      devDependencies['prisma'] = '^6.0.1';
    } else if (config.databaseType === 'sql' && config.sqlOption === 'sequelize') {
      dependencies['sequelize'] = '^6.37.5';
      dependencies['better-sqlite3'] = '^11.7.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.9';
    } else if (config.databaseType === 'sql') {
      dependencies['better-sqlite3'] = '^11.7.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.9';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies['mongoose'] = '^8.8.4';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies['@aws-sdk/client-dynamodb'] = '^3.699.0';
      dependencies['@aws-sdk/lib-dynamodb'] = '^3.699.0';
    }
  } else if (config.storage === 'external-url') {
    if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
      dependencies['@prisma/client'] = '^6.0.1';
      devDependencies['prisma'] = '^6.0.1';
    } else if (config.databaseType === 'sql' && config.sqlOption === 'sequelize') {
      dependencies['sequelize'] = '^6.37.5';
      dependencies['pg'] = '^8.13.1';
      dependencies['pg-hstore'] = '^2.3.4';
      devDependencies['@types/pg'] = '^8.11.10';
    } else if (config.databaseType === 'sql') {
      dependencies['pg'] = '^8.13.1';
      devDependencies['@types/pg'] = '^8.11.10';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies['mongoose'] = '^8.8.4';
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies['@aws-sdk/client-dynamodb'] = '^3.699.0';
      dependencies['@aws-sdk/lib-dynamodb'] = '^3.699.0';
    }
  }

  // Add API type dependencies
  if (config.apiType === 'graphql') {
    dependencies['graphql'] = '^16.9.0';
    dependencies['express-graphql'] = '^0.12.0';
    devDependencies['@types/express-graphql'] = '^0.12.0';
  }

  const packageJson = withEngines({
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
  });

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
  } else if (config.storage === 'mongodb' && config.databaseUrl) {
    envExample += `DATABASE_URL=${config.databaseUrl}\n`;
  }

  await fs.writeFile(path.join(backendPath, '.env.example'), envExample);

  // Create database setup if needed
  if (config.storage === 'local-json') {
    await generateJSONFileSetup(srcPath, config);
  } else if (config.databaseType === 'sql' && config.sqlOption === 'prisma') {
    await generatePrismaConfig(backendPath, config);
  } else if (config.databaseType === 'sql' && config.sqlOption === 'sequelize') {
    await generateSequelizeSetup(srcPath, config);
  } else if (config.databaseType === 'sql' && config.storage === 'local-sqlite') {
    await generateSQLiteSetup(srcPath, config);
  } else if (
    config.storage === 'mongodb' ||
    (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb')
  ) {
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

  // Create deployment files
  await generateBackendDeployment(backendPath, config);
  await writeOpenApiSpec(backendPath, config);
  if (config.deploymentStrategy === 'ecs') {
    await writeEcsDeploymentFiles(backendPath, config);
  }
}

async function generateBackendDeployment(backendPath: string, config: ProjectConfig): Promise<void> {
  if (config.deploymentStrategy === 'ecs') {
    return;
  }
  // Render configuration
  const renderYaml = `services:
  - type: web
    name: ${config.projectName}-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
`;

  await fs.writeFile(path.join(backendPath, 'render.yaml'), renderYaml);
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

async function generateSequelizeSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const isSqlite = config.storage === 'local-sqlite';
  const dbContent = isSqlite
    ? `import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'database.sqlite'),
  logging: false,
});

export const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: DataTypes.STRING,
});

export const initDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('Sequelize connected');
};

export default sequelize;
`
    : `import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
  dialect: 'postgres',
  logging: false,
});

export const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: DataTypes.STRING,
});

export const initDatabase = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('Sequelize connected');
};

export default sequelize;
`;

  await fs.writeFile(path.join(srcPath, 'db.ts'), dbContent);
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
  const defaultUrl = config.databaseUrl ?? defaultMongoUrl(config.projectName);
  const dbContent = `import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.DATABASE_URL || '${defaultUrl}';
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

async function generateJSONFileSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const backendPath = path.dirname(srcPath);
  const dbContent = `import fs from 'fs-extra';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
fs.ensureDirSync(dataDir);

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeJSONSync(DB_FILE, { users: [] }, { spaces: 2 });
}

// Read database
export const readDB = (): any => {
  try {
    return fs.readJSONSync(DB_FILE);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [] };
  }
};

// Write database
export const writeDB = (data: any): void => {
  try {
    fs.writeJSONSync(DB_FILE, data, { spaces: 2 });
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
};

// Helper functions
export const getUsers = () => {
  const db = readDB();
  return db.users || [];
};

export const addUser = (user: any) => {
  const db = readDB();
  if (!db.users) db.users = [];
  const newUser = { ...user, id: db.users.length + 1, createdAt: new Date().toISOString() };
  db.users.push(newUser);
  writeDB(db);
  return newUser;
};

export const getUserById = (id: number) => {
  const db = readDB();
  return db.users?.find((u: any) => u.id === id);
};

export const updateUser = (id: number, updates: any) => {
  const db = readDB();
  const userIndex = db.users?.findIndex((u: any) => u.id === id);
  if (userIndex !== -1 && userIndex !== undefined) {
    db.users[userIndex] = { ...db.users[userIndex], ...updates, updatedAt: new Date().toISOString() };
    writeDB(db);
    return db.users[userIndex];
  }
  return null;
};

export const deleteUser = (id: number) => {
  const db = readDB();
  db.users = db.users?.filter((u: any) => u.id !== id) || [];
  writeDB(db);
  return true;
};

export default { readDB, writeDB, getUsers, addUser, getUserById, updateUser, deleteUser };
`;

  await fs.writeFile(path.join(srcPath, 'db.ts'), dbContent);

  // Create initial data directory and file
  const dataPath = path.join(backendPath, 'data');
  await fs.ensureDir(dataPath);
  await fs.writeJSON(path.join(dataPath, 'database.json'), { users: [] }, { spaces: 2 });
}

