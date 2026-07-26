import { describe, it, expect } from 'vitest';
import {
  sanitizeProjectName,
  getDefaultProjectName,
  validateProjectName,
} from '../../src/utils/project-name';
import { validateDatabaseUrl } from '../../src/utils/validate';

describe('sanitizeProjectName', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(sanitizeProjectName('My Cool App')).toBe('my-cool-app');
  });

  it('replaces underscores with hyphens', () => {
    expect(sanitizeProjectName('my_cool_app')).toBe('my-cool-app');
  });

  it('strips invalid characters', () => {
    expect(sanitizeProjectName('My@App!#2024')).toBe('myapp2024');
  });

  it('collapses multiple hyphens', () => {
    expect(sanitizeProjectName('my---app')).toBe('my-app');
  });

  it('trims leading and trailing hyphens', () => {
    expect(sanitizeProjectName('--my-app--')).toBe('my-app');
  });

  it('returns empty string when nothing remains', () => {
    expect(sanitizeProjectName('@@@')).toBe('');
  });
});

describe('getDefaultProjectName', () => {
  it('uses the basename of the provided cwd', () => {
    expect(getDefaultProjectName('/Users/dev/Ecommerce Store')).toBe(
      'ecommerce-store'
    );
  });

  it('falls back to my-project when basename sanitizes to empty', () => {
    expect(getDefaultProjectName('/tmp/!!!')).toBe('my-project');
  });

  it('handles Windows-style paths', () => {
    expect(getDefaultProjectName('C:\\Users\\dev\\My Project')).toBe(
      'my-project'
    );
  });
});

describe('validateProjectName', () => {
  it('accepts valid names', () => {
    expect(validateProjectName('my-app')).toBe(true);
    expect(validateProjectName('app123')).toBe(true);
    expect(validateProjectName('a')).toBe(true);
  });

  it('rejects empty names', () => {
    expect(validateProjectName('')).toBe('Project name cannot be empty');
    expect(validateProjectName('   ')).toBe('Project name cannot be empty');
  });

  it('rejects uppercase and special characters', () => {
    expect(validateProjectName('MyApp')).toContain('lowercase');
    expect(validateProjectName('my_app')).toContain('lowercase');
    expect(validateProjectName('my app')).toContain('lowercase');
  });
});

describe('validateDatabaseUrl', () => {
  it('accepts non-empty urls', () => {
    expect(validateDatabaseUrl('postgres://localhost/db')).toBe(true);
  });

  it('rejects empty urls', () => {
    expect(validateDatabaseUrl('')).toBe('Database URL cannot be empty');
    expect(validateDatabaseUrl('  ')).toBe('Database URL cannot be empty');
  });
});
