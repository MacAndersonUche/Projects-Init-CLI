import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import {
  AugmentOptions,
  AugmentSection,
  ProjectConfig,
  TestSuite,
} from './types';
import { detectExistingProject } from './utils/detect';
import {
  generateBackend,
  generateFrontend,
  generateRootFiles,
} from './templates';
import { writeRenovateConfig } from './templates/shared/renovate';
import { writeOpenApiSpec } from './templates/shared/openapi';
import { writeEcsDeploymentFiles } from './templates/shared/ecs';
import {
  writeBackendExtraTests,
  writeFrontendExtraTests,
  writeRootTestTooling,
  rootTestScripts,
} from './templates/shared/test-suites';

function sectionToTestSuite(section: AugmentSection): TestSuite | undefined {
  switch (section) {
    case 'tests-unit':
      return 'unit';
    case 'tests-integration':
      return 'integration';
    case 'tests-e2e':
      return 'e2e';
    case 'tests-performance':
      return 'performance';
    default:
      return undefined;
  }
}

function buildConfigFromAugment(
  info: Awaited<ReturnType<typeof detectExistingProject>>,
  options: AugmentOptions
): ProjectConfig {
  const testSuites = options.sections
    .map(sectionToTestSuite)
    .filter((s): s is TestSuite => Boolean(s));

  return {
    projectName: info.projectName,
    projectLayout: 'root',
    packageManager: options.packageManager || info.packageManager,
    frontend: options.frontend || 'react',
    backend: options.backend || 'express',
    storage: 'local-json',
    apiType: options.apiType || 'rest',
    deploymentStrategy: options.deploymentStrategy || 'render',
    testSuites: testSuites.length > 0 ? testSuites : undefined,
  };
}

async function mergeRootTestScripts(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const pkgPath = path.join(projectPath, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    return;
  }
  const pkg = (await fs.readJSON(pkgPath)) as {
    scripts?: Record<string, string>;
    [key: string]: unknown;
  };
  pkg.scripts = {
    ...(pkg.scripts || {}),
    ...rootTestScripts(config),
  };
  await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
}

export async function augmentProject(options: AugmentOptions): Promise<void> {
  const info = await detectExistingProject(options.projectPath);
  const sections = options.sections.filter((s) =>
    info.missingSections.includes(s)
  );

  if (sections.length === 0) {
    console.log(chalk.yellow('Nothing to add — selected sections already exist.'));
    return;
  }

  const config = buildConfigFromAugment(info, { ...options, sections });
  console.log(chalk.blue(`\n🔧 Augmenting ${info.projectName}...`));

  for (const section of sections) {
    console.log(chalk.cyan(`  + ${section}`));

    switch (section) {
      case 'frontend':
        await generateFrontend(info.projectPath, config);
        break;
      case 'backend':
        await generateBackend(info.projectPath, config);
        break;
      case 'docs':
      case 'cicd':
        await generateRootFiles(info.projectPath, {
          ...config,
          testSuites: config.testSuites,
        });
        break;
      case 'renovate':
        await writeRenovateConfig(info.projectPath);
        break;
      case 'openapi': {
        const backendPath = path.join(info.projectPath, 'backend');
        if (await fs.pathExists(backendPath)) {
          await writeOpenApiSpec(backendPath, config);
        }
        break;
      }
      case 'ecs': {
        const backendPath = path.join(info.projectPath, 'backend');
        if (await fs.pathExists(backendPath)) {
          await writeEcsDeploymentFiles(backendPath, {
            ...config,
            deploymentStrategy: 'ecs',
          });
        }
        break;
      }
      case 'tests-unit':
      case 'tests-integration':
      case 'tests-e2e':
      case 'tests-performance': {
        const suiteConfig: ProjectConfig = {
          ...config,
          testSuites: [sectionToTestSuite(section)!],
        };
        if (info.hasFrontend) {
          const frontendPath = path.join(info.projectPath, 'frontend');
          if (await fs.pathExists(frontendPath)) {
            await writeFrontendExtraTests(frontendPath, suiteConfig);
          }
        }
        if (info.hasBackend) {
          const backendPath = path.join(info.projectPath, 'backend');
          if (await fs.pathExists(backendPath)) {
            await writeBackendExtraTests(backendPath, suiteConfig);
          }
        }
        await writeRootTestTooling(info.projectPath, suiteConfig);
        await mergeRootTestScripts(info.projectPath, suiteConfig);
        break;
      }
      default:
        break;
    }
  }

  console.log(chalk.green(`\n✨ Added: ${sections.join(', ')}`));
}

export { detectExistingProject } from './utils/detect';
