import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateFastAPI(backendPath: string, config: ProjectConfig): Promise<void> {
  const dependencies: string[] = [
    'fastapi==0.104.1',
    'uvicorn[standard]==0.24.0',
    'python-dotenv==1.0.0',
    'pydantic==2.5.2',
    'pydantic-settings==2.1.0'
  ];

  // Add database dependencies
  if (config.storage === 'local-sqlite') {
    if (config.databaseType === 'sql') {
      dependencies.push('sqlalchemy==2.0.23');
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies.push('motor==3.3.2');
      dependencies.push('pymongo==4.6.1');
    }
  } else if (config.storage === 'external-url') {
    if (config.databaseType === 'sql') {
      dependencies.push('sqlalchemy==2.0.23');
      dependencies.push('psycopg2-binary==2.9.9');
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies.push('motor==3.3.2');
      dependencies.push('pymongo==4.6.1');
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies.push('boto3==1.29.7');
    }
  }

  // Create requirements.txt
  await fs.writeFile(path.join(backendPath, 'requirements.txt'), dependencies.join('\n'));

  // Create main.py
  const srcPath = path.join(backendPath, 'src');
  await fs.ensureDir(srcPath);

  let mainContent = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="${config.projectName} API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to ${config.projectName} API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3001))
    uvicorn.run(app, host="0.0.0.0", port=port)
`;

  await fs.writeFile(path.join(srcPath, 'main.py'), mainContent);

  // Create .env.example
  let envExample = `PORT=3001
`;

  if (config.storage === 'external-url' && config.databaseUrl) {
    envExample += `DATABASE_URL=${config.databaseUrl}\n`;
  }

  await fs.writeFile(path.join(backendPath, '.env.example'), envExample);

  // Create database setup if needed
  if (config.databaseType === 'sql') {
    await generateSQLAlchemySetup(srcPath, config);
  } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
    await generateMongoDBSetup(srcPath, config);
  } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
    await generateDynamoDBSetup(srcPath, config);
  }
}

async function generateSQLAlchemySetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbUrlLine = config.storage === 'local-sqlite' 
    ? 'DATABASE_URL = "sqlite:///./database.db"' 
    : 'DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")';
    
  const dbContent = `from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

${dbUrlLine}

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`;

  await fs.writeFile(path.join(srcPath, 'database.py'), dbContent);
}

async function generateMongoDBSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbContent = `from motor.motor_asyncio import AsyncIOMotorClient
import os

DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
DATABASE_NAME = "${config.projectName}"

client = AsyncIOMotorClient(DATABASE_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
`;

  await fs.writeFile(path.join(srcPath, 'database.py'), dbContent);
}

async function generateDynamoDBSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const dbContent = `import boto3
import os

dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

# Table references
users_table = dynamodb.Table('users')
`;

  await fs.writeFile(path.join(srcPath, 'database.py'), dbContent);
}

