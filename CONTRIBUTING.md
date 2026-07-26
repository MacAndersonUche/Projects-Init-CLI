# Contributing to Projects Init CLI

Thanks for your interest in contributing! This guide explains how to set up the project, run checks, and open a high-quality pull request.

## Code of conduct

Participation is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive.

## Ways to contribute

- Report bugs and request features via [GitHub Issues](https://github.com/MacAndersonUche/Projects-Init-CLI/issues)
- Improve documentation (README, CONTRIBUTING, comments)
- Add or harden generators (frontend/backend/storage/ORM options)
- Expand test coverage
- Fix CI, release, or developer experience issues

## Development setup

### Prerequisites

- Node.js **18+** (20 LTS recommended)
- npm **9+**
- Git

### Clone and install

```bash
git clone https://github.com/MacAndersonUche/Projects-Init-CLI.git
cd Projects-Init-CLI
npm install
```

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Run the CLI via `ts-node` |
| `npm test` | Run the full Vitest suite once |
| `npm run test:watch` | Re-run tests on change |
| `npm run test:coverage` | Run tests with coverage report |
| `npm start` | Run the compiled CLI from `dist/` |

### Local linking (optional)

```bash
npm run build
npm link
projects-init
```

## Project layout

```text
src/
  index.ts              # CLI entrypoint (commander)
  prompts.ts            # Interactive prompts
  generator.ts          # Orchestrates scaffolding
  types.ts              # Shared config types
  utils/                # Pure helpers (naming, paths, validation)
  templates/
    frontend/           # Next.js / React / HTML generators
    backend/            # Express / Nest / FastAPI / CDK / SAM
tests/
  helpers/              # Shared fixtures for tests
  unit/                 # Focused generator/helper tests
  integration/          # End-to-end scaffolding tests
.github/
  workflows/            # CI + publish
```

## Making changes

1. Create a branch from `master`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Prefer small, focused commits.
3. Keep generators deterministic and filesystem-based (write files; avoid network calls).
4. Extract pure logic into `src/utils/` when it helps testing.
5. Update docs when you change user-facing prompts or options.

### Adding a new template option

1. Extend types in `src/types.ts`
2. Add prompt choices in `src/prompts.ts`
3. Update the relevant generator under `src/templates/`
4. Add unit tests under `tests/unit/` covering dependencies and emitted files
5. Add or extend an integration case in `tests/integration/` when the option affects layout/wiring
6. Update `README.md` feature lists

## Testing expectations

All PRs should keep `npm test` and `npm run build` green.

Cover at least:

- Happy path for new generators/options (files exist, key deps present)
- Validation / error paths (invalid names, non-empty root, existing folder)
- Regression for nearby options (Prisma vs Sequelize, MongoDB local vs external)

Tests use temporary directories and set `PROJECTS_INIT_SKIP_GIT=1` during scaffolding so CI does not depend on git identity config.

```bash
npm test
npm run test:coverage
```

## Commit and PR guidelines

### Commits

Use clear, imperative messages, for example:

- `Add Sequelize scaffolding for Express`
- `Fix root layout empty-directory check`
- `Document contribution workflow`

### Pull requests

- Fill out the PR template
- Link related issues (`Fixes #123`)
- Describe what changed and how you tested it
- Keep diffs reviewable; split large work when possible
- Do not commit secrets, `.env` files, or `node_modules`

### Versioning / releases

Maintainers bump versions with semver and publish via the npm workflow.

- Patch: bug fixes / docs
- Minor: new options or backwards-compatible features
- Major: breaking CLI / config changes

Do not bump the package version in a normal contribution unless a maintainer asks you to.

## Reporting bugs

Include:

- OS and Node.js version
- CLI version (`projects-init --version`)
- Exact prompts/answers chosen
- Expected vs actual behavior
- Logs / stack traces

## Feature requests

Describe the use case, proposed UX (prompts/options), and any alternatives considered.

## Security

If you believe you found a vulnerability, **do not** open a public issue. Email the maintainer listed on the GitHub profile / npm package, or open a private security advisory on GitHub when available.

## License

By contributing, you agree that your contributions are licensed under the MIT License.
