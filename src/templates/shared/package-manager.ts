import { PackageManager } from '../../types';

export function workspaceRun(
  pm: PackageManager,
  script: string,
  projectName: string,
  side: 'frontend' | 'backend'
): string {
  const packageName = side === 'frontend' ? `${projectName}-frontend` : `${projectName}-backend`;
  const folder = side;

  switch (pm) {
    case 'yarn':
      return `yarn workspace ${packageName} ${script}`;
    case 'pnpm':
      return `pnpm --filter ${packageName} ${script}`;
    default:
      return `npm run ${script} --workspace=${folder}`;
  }
}

export function workspacesRun(pm: PackageManager, script: string): string {
  switch (pm) {
    case 'yarn':
      return `yarn workspaces run ${script}`;
    case 'pnpm':
      return `pnpm -r run ${script}`;
    default:
      return `npm run ${script} --workspaces --if-present`;
  }
}

export function installCommand(pm: PackageManager): string {
  switch (pm) {
    case 'yarn':
      return 'yarn install';
    case 'pnpm':
      return 'pnpm install';
    default:
      return 'npm install';
  }
}

export function ciCommand(pm: PackageManager): string {
  switch (pm) {
    case 'yarn':
      return 'yarn install --immutable';
    case 'pnpm':
      return 'pnpm install --frozen-lockfile';
    default:
      return 'npm ci';
  }
}

export function packageManagerLabel(pm: PackageManager): string {
  return pm;
}

export function packageManagerVersionField(pm: PackageManager): string | undefined {
  switch (pm) {
    case 'yarn':
      return 'yarn@1.22.22';
    case 'pnpm':
      return 'pnpm@11.17.0';
    default:
      return undefined;
  }
}

export function rootDevScript(pm: PackageManager, projectName: string): string {
  const frontend = workspaceRun(pm, 'dev', projectName, 'frontend');
  const backend = workspaceRun(pm, 'dev', projectName, 'backend');
  return `concurrently "${frontend}" "${backend}"`;
}

export function nodeSetupCache(pm: PackageManager): string {
  return pm;
}

export function ciSetupExtraSteps(pm: PackageManager): string {
  if (pm === 'pnpm') {
    return `
    - uses: pnpm/action-setup@v4
      with:
        version: 9
`;
  }
  return '';
}

export function ciInstallWorkspace(pm: PackageManager, workspace: 'frontend' | 'backend'): string {
  switch (pm) {
    case 'yarn':
      return 'yarn install --immutable';
    case 'pnpm':
      return 'pnpm install --frozen-lockfile';
    default:
      return `npm ci --workspace=${workspace}`;
  }
}

export function renderBuildCommand(pm: PackageManager): string {
  return `${installCommand(pm)} && ${pm === 'yarn' ? 'yarn build' : pm === 'pnpm' ? 'pnpm run build' : 'npm run build'}`;
}
