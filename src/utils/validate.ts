/**
 * Shared validation helpers used by prompts and tests.
 */

export function validateDatabaseUrl(input: string): true | string {
  if (!input.trim()) {
    return 'Database URL cannot be empty';
  }
  return true;
}
