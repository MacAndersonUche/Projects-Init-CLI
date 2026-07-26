/** Supported Node.js LTS versions for generated projects (avoid odd releases like 21). */
export const RECOMMENDED_NODE = '20';

export const NODE_ENGINES = {
  node: '>=20.0.0 <21.0.0 || >=22.0.0',
  npm: '>=10.0.0',
};

export const ROOT_DEV_DEPENDENCIES = {
  concurrently: '^9.1.2',
};

export const FRONTEND_PACKAGES = {
  vite: '^5.4.11',
  vitest: '^2.1.8',
  '@vitest/ui': '^2.1.8',
  '@vitest/coverage-v8': '^2.1.8',
  '@vitejs/plugin-react': '^4.3.4',
  eslint: '^8.57.1',
  '@typescript-eslint/eslint-plugin': '^7.18.0',
  '@typescript-eslint/parser': '^7.18.0',
};

export const BACKEND_PACKAGES = {
  vitest: '^2.1.8',
  '@vitest/ui': '^2.1.8',
  '@vitest/coverage-v8': '^2.1.8',
};
