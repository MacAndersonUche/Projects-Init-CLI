export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Default project name derived from the current working directory.
 */
export function getDefaultProjectName(cwd: string = process.cwd()): string {
  const normalized = cwd.replace(/\\/g, '/');
  const folderName = normalized.split('/').filter(Boolean).pop() || '';
  return sanitizeProjectName(folderName) || 'my-project';
}

/**
 * Validate a project name against CLI rules.
 * Returns true when valid, or an error message string.
 */
export function validateProjectName(input: string): true | string {
  if (!input.trim()) {
    return 'Project name cannot be empty';
  }
  if (!/^[a-z0-9-]+$/.test(input)) {
    return 'Project name can only contain lowercase letters, numbers, and hyphens';
  }
  return true;
}
