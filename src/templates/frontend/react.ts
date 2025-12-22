import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateReact(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: `${config.projectName}-frontend`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@types/react': '^18.2.45',
      '@types/react-dom': '^18.2.18',
      '@typescript-eslint/eslint-plugin': '^6.15.0',
      '@typescript-eslint/parser': '^6.15.0',
      '@vitejs/plugin-react': '^4.2.1',
      eslint: '^8.56.0',
      'eslint-plugin-react-hooks': '^4.6.0',
      'eslint-plugin-react-refresh': '^0.4.5',
      typescript: '^5.3.3',
      vite: '^5.0.8',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.32',
      'autoprefixer': '^10.4.16',
      'vitest': '^1.1.0',
      '@vitest/ui': '^1.1.0',
      '@testing-library/react': '^14.1.2',
      '@testing-library/jest-dom': '^6.1.5',
      'jsdom': '^23.0.1',
      '@vitest/coverage-v8': '^1.1.0'
    }
  };

  await fs.writeJSON(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create Vite config
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
`;

  await fs.writeFile(path.join(frontendPath, 'vite.config.ts'), viteConfig);

  // Create Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

  await fs.writeFile(path.join(frontendPath, 'tailwind.config.js'), tailwindConfig);

  // Create PostCSS config
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  await fs.writeFile(path.join(frontendPath, 'postcss.config.js'), postcssConfig);

  // Create TypeScript config
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }]
  };

  await fs.writeJSON(path.join(frontendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });

  const tsconfigNode = {
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true
    },
    include: ['vite.config.ts']
  };

  await fs.writeJSON(path.join(frontendPath, 'tsconfig.node.json'), tsconfigNode, { spaces: 2 });

  // Create index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  await fs.writeFile(path.join(frontendPath, 'index.html'), indexHtml);

  // Create src directory
  const srcPath = path.join(frontendPath, 'src');
  await fs.ensureDir(srcPath);

  // Create main.tsx
  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

  await fs.writeFile(path.join(srcPath, 'main.tsx'), mainTsx);

  // Create App.tsx
  const appTsx = `function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to ${config.projectName}
        </h1>
        <p className="text-gray-600 mb-6">
          Your React application with Tailwind CSS is ready!
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            React 18
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Vite
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Tailwind CSS
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            TypeScript
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
`;

  await fs.writeFile(path.join(srcPath, 'App.tsx'), appTsx);

  // Create index.css
  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  await fs.writeFile(path.join(srcPath, 'index.css'), indexCss);

  // Create test directory and setup
  const testPath = path.join(srcPath, 'test');
  await fs.ensureDir(testPath);

  const testSetup = `import '@testing-library/jest-dom'
`;

  await fs.writeFile(path.join(testPath, 'setup.ts'), testSetup);

  // Create example test
  const testExample = `import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />)
    expect(screen.getByText(/Welcome to ${config.projectName}/i)).toBeInTheDocument()
  })
})
`;

  await fs.writeFile(path.join(testPath, 'App.test.tsx'), testExample);
}

