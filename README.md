# Projects Init CLI

A CLI tool to scaffold monorepo projects with customizable frontend, backend, storage, ORM, and API options.

[![CI](https://github.com/MacAndersonUche/Projects-Init-CLI/actions/workflows/ci.yml/badge.svg)](https://github.com/MacAndersonUche/Projects-Init-CLI/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/projects-init-cli.svg)](https://www.npmjs.com/package/projects-init-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

### Frontend

- **Next.js** — React framework with Tailwind CSS
- **React** — Vite + Tailwind CSS
- **HTML** — Plain HTML with Tailwind CSS and Vite

### Backend

- **Express.js**
- **NestJS**
- **FastAPI** (Python)
- **AWS CDK**
- **AWS SAM**

### Storage

- **CDK Database**
- **Local SQLite**
- **Local MongoDB**
- **Local JSON file**
- **External database URL**

### Database / ORM

- **SQL**: Raw SQL, Prisma, or Sequelize
- **NoSQL**: MongoDB or DynamoDB

### API types (Express / NestJS)

- REST
- GraphQL

### Project layout

- Create in a **new subfolder**, or
- Scaffold in the **current directory** (must be empty aside from `.git` / `.gitignore`)

## Installation

```bash
npm install -g projects-init-cli
```

Or run without installing:

```bash
npx projects-init-cli
```

## Usage

```bash
projects-init
```

You will be prompted for layout, project name, frontend, backend, storage, database/ORM options, and API type when applicable.

## Example

```bash
$ projects-init

🚀 Project Initializer CLI

? Where should the project be created? In a new subfolder (recommended)
? What is your project name? my-awesome-app
? Select frontend framework: Next.js (with Tailwind)
? Select backend framework: Express.js
? Select storage option: Local SQLite (Node.js)
? Select database type: SQL
? Select SQL ORM: Sequelize ORM
? Select API type: REST API

✅ Project created successfully!
```

## Generated structure

```text
my-project/
├── frontend/
├── backend/
├── package.json          # npm workspaces + concurrently
├── README.md
└── .github/workflows/    # starter CI/CD for the generated app
```

## Development

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup, coding guidelines, testing expectations, and PR process.

```bash
git clone https://github.com/MacAndersonUche/Projects-Init-CLI.git
cd Projects-Init-CLI
npm install
npm run build
npm test
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Compile TypeScript |
| `npm run dev` | Run CLI from source |
| `npm test` | Run Vitest suite |
| `npm run test:coverage` | Coverage report |
| `npm start` | Run compiled CLI |

## Contributing

Contributions are welcome!

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
3. Open an issue or pull request

## License

MIT
