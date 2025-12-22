# Projects Init CLI

A powerful CLI tool to initialize monorepo projects with customizable frontend, backend, and storage options.

## Features

### Frontend Options

- **Next.js** - React framework with Tailwind CSS
- **React** - React with Vite and Tailwind CSS
- **HTML** - Plain HTML with Tailwind CSS and Vite

### Backend Options

- **Express.js** - Node.js web framework
- **NestJS** - Progressive Node.js framework
- **FastAPI** - Modern Python web framework
- **AWS CDK** - Infrastructure as code
- **AWS SAM** - Serverless Application Model

### Storage Options

- **CDK Database** - Create database using AWS CDK
- **Local SQLite** - SQLite database for local development
- **External Database URL** - Connect to existing database

### Database Types

- **SQL**: Raw SQL or Prisma ORM
- **NoSQL**: DynamoDB or MongoDB

### API Types (for Express/NestJS)

- **REST API**
- **GraphQL**

## Installation

### Global Installation

```bash
npm install -g projects-init-cli
```

### Local Installation

```bash
npm install
npm run build
npm link
```

### Use with npx (No Installation Required)

```bash
npx projects-init-cli
```

## Usage

Run the CLI tool:

```bash
projects-init
```

The tool will guide you through interactive prompts to select:

1. Project name
2. Frontend framework
3. Backend framework
4. Storage option
5. Database type (if applicable)
6. Database options (SQL/NoSQL, ORM, etc.)
7. API type (for Express/NestJS)

## Example

```bash
$ projects-init

🚀 Project Initializer CLI

? What is your project name? my-awesome-app
? Select frontend framework: Next.js (with Tailwind)
? Select backend framework: Express.js
? Select storage option: Local SQLite (Node.js)
? Select database type: SQL
? Select SQL option: Prisma ORM
? Select API type: REST API

✅ Project created successfully!

Next steps:
  cd my-awesome-app
  npm install
  npm run dev
```

## Project Structure

Generated projects follow a monorepo structure:

```
my-project/
├── frontend/          # Frontend application
├── backend/           # Backend application
├── package.json       # Root package.json with workspaces
└── README.md          # Project documentation
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## License

MIT
