import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';
import { defaultMongoUrl } from '../shared/project-docs';

export async function generateFastAPI(backendPath: string, config: ProjectConfig): Promise<void> {
  const dependencies: string[] = [
    'fastapi==0.115.6',
    'uvicorn[standard]==0.32.1',
    'python-dotenv==1.0.1',
    'pydantic==2.10.3',
    'pydantic-settings==2.6.1'
  ];

  // Add database dependencies
  if (config.storage === 'local-json') {
    // No additional dependencies needed for JSON file storage (uses built-in json module)
  } else if (config.storage === 'mongodb') {
    dependencies.push('motor==3.6.0');
    dependencies.push('pymongo==4.10.1');
  } else if (config.storage === 'local-sqlite') {
    if (config.databaseType === 'sql') {
      dependencies.push('sqlalchemy==2.0.36');
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies.push('motor==3.6.0');
      dependencies.push('pymongo==4.10.1');
    }
  } else if (config.storage === 'external-url') {
    if (config.databaseType === 'sql') {
      dependencies.push('sqlalchemy==2.0.36');
      dependencies.push('psycopg2-binary==2.9.10');
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb') {
      dependencies.push('motor==3.6.0');
      dependencies.push('pymongo==4.10.1');
    } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
      dependencies.push('boto3==1.35.47');
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
  } else if (config.storage === 'mongodb' && config.databaseUrl) {
    envExample += `DATABASE_URL=${config.databaseUrl}\n`;
  }

  await fs.writeFile(path.join(backendPath, '.env.example'), envExample);

  // Create database setup if needed
  if (config.storage === 'local-json') {
    await generateJSONFileSetup(srcPath, config);
  } else if (config.databaseType === 'sql') {
    await generateSQLAlchemySetup(srcPath, config);
  } else if (
    config.storage === 'mongodb' ||
    (config.databaseType === 'nosql' && config.nosqlOption === 'mongodb')
  ) {
    await generateMongoDBSetup(srcPath, config);
  } else if (config.databaseType === 'nosql' && config.nosqlOption === 'dynamodb') {
    await generateDynamoDBSetup(srcPath, config);
  }

  // Create deployment files
  await generateBackendDeployment(backendPath, config);
}

async function generateBackendDeployment(backendPath: string, config: ProjectConfig): Promise<void> {
  // Render configuration
  const renderYaml = `services:
  - type: web
    name: ${config.projectName}-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn src.main:app --host 0.0.0.0 --port \$PORT
    envVars:
      - key: PORT
        value: 3001
`;

  await fs.writeFile(path.join(backendPath, 'render.yaml'), renderYaml);
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
  const defaultUrl = config.databaseUrl ?? defaultMongoUrl(config.projectName);
  const dbContent = `from motor.motor_asyncio import AsyncIOMotorClient
import os

DATABASE_URL = os.getenv("DATABASE_URL", "${defaultUrl}")
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

async function generateJSONFileSetup(srcPath: string, config: ProjectConfig): Promise<void> {
  const backendPath = path.dirname(srcPath);
  const dbContent = `import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

DB_FILE = Path(__file__).parent.parent / 'data' / 'database.json'

# Ensure data directory exists
DB_FILE.parent.mkdir(parents=True, exist_ok=True)

# Initialize database file if it doesn't exist
if not DB_FILE.exists():
    with open(DB_FILE, 'w') as f:
        json.dump({'users': []}, f, indent=2)

def read_db() -> Dict[str, Any]:
    """Read the database from JSON file."""
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {'users': []}

def write_db(data: Dict[str, Any]) -> None:
    """Write data to the database JSON file."""
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_users() -> List[Dict[str, Any]]:
    """Get all users from the database."""
    db = read_db()
    return db.get('users', [])

def add_user(user: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new user to the database."""
    db = read_db()
    users = db.get('users', [])
    new_user = {
        **user,
        'id': len(users) + 1,
        'created_at': str(Path(__file__).stat().st_mtime)
    }
    users.append(new_user)
    db['users'] = users
    write_db(db)
    return new_user

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get a user by ID."""
    users = get_users()
    return next((u for u in users if u.get('id') == user_id), None)

def update_user(user_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a user by ID."""
    db = read_db()
    users = db.get('users', [])
    for i, user in enumerate(users):
        if user.get('id') == user_id:
            users[i] = {**user, **updates, 'updated_at': str(Path(__file__).stat().st_mtime)}
            db['users'] = users
            write_db(db)
            return users[i]
    return None

def delete_user(user_id: int) -> bool:
    """Delete a user by ID."""
    db = read_db()
    users = db.get('users', [])
    db['users'] = [u for u in users if u.get('id') != user_id]
    write_db(db)
    return True
`;

  await fs.writeFile(path.join(srcPath, 'database.py'), dbContent);

  // Create initial data directory and file
  const dataPath = path.join(backendPath, 'data');
  await fs.ensureDir(dataPath);
  await fs.writeJSON(path.join(dataPath, 'database.json'), { users: [] }, { spaces: 2 });
}

