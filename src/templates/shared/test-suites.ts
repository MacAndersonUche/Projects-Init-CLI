import fs from 'fs-extra';
import path from 'path';
import { PackageManager, ProjectConfig, TestSuite, ALL_TEST_SUITES } from '../../types';
import { PKG } from './constants';
import { workspaceRun } from './package-manager';

export function resolvedTestSuites(config: ProjectConfig): TestSuite[] {
  if (!config.testSuites || config.testSuites.length === 0) {
    return [...ALL_TEST_SUITES];
  }
  return config.testSuites;
}

export function hasTestSuite(config: ProjectConfig, suite: TestSuite): boolean {
  return resolvedTestSuites(config).includes(suite);
}

export function packageTestScripts(config: ProjectConfig): Record<string, string> {
  const scripts: Record<string, string> = {};
  if (hasTestSuite(config, 'unit')) {
    scripts.test = 'vitest run';
    scripts['test:watch'] = 'vitest';
    scripts['test:ui'] = 'vitest --ui';
    scripts['test:coverage'] = 'vitest run --coverage';
    scripts['test:unit'] = 'vitest run';
  }
  if (hasTestSuite(config, 'integration')) {
    scripts['test:integration'] = 'vitest run --dir src/__tests__/integration';
  }
  if (hasTestSuite(config, 'e2e')) {
    scripts['test:e2e'] = 'playwright test';
  }
  if (hasTestSuite(config, 'performance')) {
    scripts['test:performance'] = 'node scripts/performance.mjs';
  }
  return scripts;
}

export function rootTestScripts(config: ProjectConfig): Record<string, string> {
  const pm = config.packageManager;
  const scripts: Record<string, string> = {};
  const suites = resolvedTestSuites(config);

  if (suites.includes('unit')) {
    scripts['test:unit'] = [
      workspaceRun(pm, 'test:unit', config.projectName, 'frontend'),
      workspaceRun(pm, 'test:unit', config.projectName, 'backend'),
    ].join(' && ');
    scripts.test = scripts['test:unit'];
  }

  if (suites.includes('integration')) {
    scripts['test:integration'] = [
      workspaceRun(pm, 'test:integration', config.projectName, 'frontend'),
      workspaceRun(pm, 'test:integration', config.projectName, 'backend'),
    ].join(' && ');
  }

  if (suites.includes('e2e')) {
    scripts['test:e2e'] = 'playwright test';
  }

  if (suites.includes('performance')) {
    scripts['test:performance'] = 'node scripts/performance.mjs';
  }

  if (!scripts.test && suites.length > 0) {
    scripts.test = Object.values(scripts)[0];
  }

  return scripts;
}

export function vitestDevDependencies(config: ProjectConfig): Record<string, string> {
  if (!hasTestSuite(config, 'unit') && !hasTestSuite(config, 'integration')) {
    return {};
  }
  return {
    vitest: PKG.vitest,
    '@vitest/ui': PKG['@vitest/ui'],
    '@vitest/coverage-v8': PKG['@vitest/coverage-v8'],
  };
}

export function e2eDevDependencies(config: ProjectConfig): Record<string, string> {
  if (!hasTestSuite(config, 'e2e')) {
    return {};
  }
  return {
    '@playwright/test': '^1.58.0',
  };
}

export function performanceDevDependencies(config: ProjectConfig): Record<string, string> {
  if (!hasTestSuite(config, 'performance')) {
    return {};
  }
  return {
    autocannon: '^8.0.0',
  };
}

export async function writeBackendExtraTests(
  backendPath: string,
  config: ProjectConfig,
  options: { healthPath?: string } = {}
): Promise<void> {
  const healthPath = options.healthPath ?? '/health';

  if (hasTestSuite(config, 'integration')) {
    const dir = path.join(backendPath, 'src', '__tests__', 'integration');
    await fs.ensureDir(dir);
    const content = `import { describe, it, expect } from 'vitest';

describe('backend integration', () => {
  it('loads environment defaults', () => {
    expect(process.env.NODE_ENV || 'test').toBeTruthy();
  });

  it('documents the health endpoint contract', () => {
    expect('${healthPath}').toMatch(/^\\//);
  });
});
`;
    await fs.writeFile(path.join(dir, 'health.integration.test.ts'), content);
  }

  if (hasTestSuite(config, 'e2e')) {
    const dir = path.join(backendPath, 'e2e');
    await fs.ensureDir(dir);
    const content = `import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3001';

test.describe('backend e2e', () => {
  test('health endpoint responds', async ({ request }) => {
    const response = await request.get(\`\${baseURL}${healthPath}\`);
    expect(response.ok()).toBeTruthy();
  });
});
`;
    await fs.writeFile(path.join(dir, 'health.e2e.ts'), content);
  }

  if (hasTestSuite(config, 'performance')) {
    const scriptsDir = path.join(backendPath, 'scripts');
    await fs.ensureDir(scriptsDir);
    const content = `import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const autocannon = require('autocannon');

const url = process.env.PERF_BASE_URL || 'http://localhost:3001${healthPath}';

const result = await autocannon({
  url,
  connections: 10,
  duration: 5,
});

console.log(autocannon.printResult(result));

if (result.errors > 0 || result.non2xx > 0) {
  process.exitCode = 1;
}
`;
    await fs.writeFile(path.join(scriptsDir, 'performance.mjs'), content);
  }
}

export async function writeFrontendExtraTests(
  frontendPath: string,
  config: ProjectConfig
): Promise<void> {
  if (hasTestSuite(config, 'integration')) {
    const dir = path.join(frontendPath, 'src', '__tests__', 'integration');
    await fs.ensureDir(dir);
    const content = `import { describe, it, expect } from 'vitest';

describe('frontend integration', () => {
  it('has a browser-like environment available for component tests', () => {
    expect(typeof window === 'undefined' || typeof document !== 'undefined').toBe(true);
  });
});
`;
    await fs.writeFile(path.join(dir, 'smoke.integration.test.ts'), content);
  }

  if (hasTestSuite(config, 'e2e')) {
    const dir = path.join(frontendPath, 'e2e');
    await fs.ensureDir(dir);
    const content = `import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';

test.describe('frontend e2e', () => {
  test('home page loads', async ({ page }) => {
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/.+/);
  });
});
`;
    await fs.writeFile(path.join(dir, 'home.e2e.ts'), content);
  }
}

export async function writeRootTestTooling(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  if (hasTestSuite(config, 'e2e')) {
    const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['**/e2e/**/*.e2e.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
});
`;
    await fs.writeFile(path.join(projectPath, 'playwright.config.ts'), playwrightConfig);
  }

  if (hasTestSuite(config, 'performance')) {
    const scriptsDir = path.join(projectPath, 'scripts');
    await fs.ensureDir(scriptsDir);
    const content = `import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const backendScript = path.join(root, '..', 'backend', 'scripts', 'performance.mjs');

const child = spawn(process.execPath, [backendScript], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
`;
    await fs.writeFile(path.join(scriptsDir, 'performance.mjs'), content);
  }
}

export function testSuiteLabel(suites: TestSuite[]): string {
  return suites.join(', ');
}

export function ensurePackageManager(pm?: PackageManager): PackageManager {
  return pm ?? 'npm';
}
