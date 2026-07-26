import fs from 'fs-extra';
import path from 'path';
import { AugmentSection, PackageManager } from '../types';

export interface ExistingProjectInfo {
  projectPath: string;
  projectName: string;
  packageManager: PackageManager;
  hasFrontend: boolean;
  hasBackend: boolean;
  hasOpenApi: boolean;
  hasRenovate: boolean;
  hasCiCd: boolean;
  hasEcs: boolean;
  hasDocs: boolean;
  hasUnitTests: boolean;
  hasIntegrationTests: boolean;
  hasE2eTests: boolean;
  hasPerformanceTests: boolean;
  missingSections: AugmentSection[];
}

async function pathExistsAny(paths: string[]): Promise<boolean> {
  for (const p of paths) {
    if (await fs.pathExists(p)) {
      return true;
    }
  }
  return false;
}

export async function detectExistingProject(
  projectPath: string = process.cwd()
): Promise<ExistingProjectInfo> {
  const resolved = path.resolve(projectPath);
  const rootPkgPath = path.join(resolved, 'package.json');

  if (!(await fs.pathExists(rootPkgPath))) {
    throw new Error(
      'No package.json found. Run this command from an existing projects-init scaffold (or pass --path).'
    );
  }

  const rootPkg = (await fs.readJSON(rootPkgPath)) as {
    name?: string;
    packageManager?: string;
    scripts?: Record<string, string>;
  };

  const packageManager: PackageManager = rootPkg.packageManager?.startsWith('pnpm')
    ? 'pnpm'
    : rootPkg.packageManager?.startsWith('yarn')
      ? 'yarn'
      : (await fs.pathExists(path.join(resolved, 'pnpm-workspace.yaml')))
        ? 'pnpm'
        : (await fs.pathExists(path.join(resolved, 'yarn.lock')))
          ? 'yarn'
          : 'npm';

  const hasFrontend = await fs.pathExists(path.join(resolved, 'frontend'));
  const hasBackend = await fs.pathExists(path.join(resolved, 'backend'));
  const hasOpenApi = await pathExistsAny([
    path.join(resolved, 'backend', 'docs', 'openapi.yaml'),
    path.join(resolved, 'backend', 'docs', 'openapi.yml'),
  ]);
  const hasRenovate = await fs.pathExists(path.join(resolved, 'renovate.json'));
  const hasCiCd = await pathExistsAny([
    path.join(resolved, '.github', 'workflows', 'ci.yml'),
    path.join(resolved, '.github', 'workflows', 'deploy.yml'),
  ]);
  const hasEcs = await pathExistsAny([
    path.join(resolved, 'backend', 'deploy', 'ecs'),
    path.join(resolved, 'backend', 'Dockerfile'),
  ]);
  const hasDocs = await fs.pathExists(path.join(resolved, 'docs'));

  const hasUnitTests = await pathExistsAny([
    path.join(resolved, 'frontend', 'src', 'test'),
    path.join(resolved, 'backend', 'src', '__tests__'),
  ]);
  const hasIntegrationTests = await pathExistsAny([
    path.join(resolved, 'frontend', 'src', '__tests__', 'integration'),
    path.join(resolved, 'backend', 'src', '__tests__', 'integration'),
  ]);
  const hasE2eTests = await pathExistsAny([
    path.join(resolved, 'playwright.config.ts'),
    path.join(resolved, 'frontend', 'e2e'),
    path.join(resolved, 'backend', 'e2e'),
  ]);
  const hasPerformanceTests = await pathExistsAny([
    path.join(resolved, 'scripts', 'performance.mjs'),
    path.join(resolved, 'backend', 'scripts', 'performance.mjs'),
  ]);

  const missingSections: AugmentSection[] = [];
  if (!hasFrontend) missingSections.push('frontend');
  if (!hasBackend) missingSections.push('backend');
  if (!hasOpenApi && hasBackend) missingSections.push('openapi');
  if (!hasRenovate) missingSections.push('renovate');
  if (!hasCiCd) missingSections.push('cicd');
  if (!hasEcs && hasBackend) missingSections.push('ecs');
  if (!hasDocs) missingSections.push('docs');
  if (!hasUnitTests) missingSections.push('tests-unit');
  if (!hasIntegrationTests) missingSections.push('tests-integration');
  if (!hasE2eTests) missingSections.push('tests-e2e');
  if (!hasPerformanceTests) missingSections.push('tests-performance');

  return {
    projectPath: resolved,
    projectName: rootPkg.name || path.basename(resolved),
    packageManager,
    hasFrontend,
    hasBackend,
    hasOpenApi,
    hasRenovate,
    hasCiCd,
    hasEcs,
    hasDocs,
    hasUnitTests,
    hasIntegrationTests,
    hasE2eTests,
    hasPerformanceTests,
    missingSections,
  };
}
