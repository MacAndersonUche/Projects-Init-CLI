import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateNextJS(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: `${config.projectName}-frontend`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      next: '^14.0.4'
    },
    devDependencies: {
      '@types/node': '^20.10.6',
      '@types/react': '^18.2.45',
      '@types/react-dom': '^18.2.18',
      typescript: '^5.3.3',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.32',
      'autoprefixer': '^10.4.16',
      'eslint': '^8.56.0',
      'eslint-config-next': '^14.0.4',
      'vitest': '^1.1.0',
      '@vitest/ui': '^1.1.0',
      '@testing-library/react': '^14.1.2',
      '@testing-library/jest-dom': '^6.1.5',
      '@vitejs/plugin-react': '^4.2.1',
      'jsdom': '^23.0.1',
      '@vitest/coverage-v8': '^1.1.0'
    }
  };

  await fs.writeJSON(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create Next.js config
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`;

  await fs.writeFile(path.join(frontendPath, 'next.config.js'), nextConfig);

  // Create Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

  await fs.writeFile(path.join(frontendPath, 'tailwind.config.js'), tailwindConfig);

  // Create PostCSS config
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  await fs.writeFile(path.join(frontendPath, 'postcss.config.js'), postcssConfig);

  // Create Vitest config
  const vitestConfig = `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
`;

  await fs.writeFile(path.join(frontendPath, 'vitest.config.ts'), vitestConfig);

  // Create TypeScript config
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  };

  await fs.writeJSON(path.join(frontendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // Create app directory structure
  const appPath = path.join(frontendPath, 'app');
  await fs.ensureDir(appPath);

  // Create layout
  const layout = `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${config.projectName}',
  description: 'Generated with Projects Init CLI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`;

  await fs.writeFile(path.join(appPath, 'layout.tsx'), layout);

  // Create page
  const page = `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to ${config.projectName}
        </h1>
        <p className="text-gray-600 mb-6">
          Your Next.js application with Tailwind CSS is ready!
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Next.js 14
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
`;

  await fs.writeFile(path.join(appPath, 'page.tsx'), page);

  // Create globals.css
  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  await fs.writeFile(path.join(appPath, 'globals.css'), globalsCss);

  // Create test directory and setup
  const testPath = path.join(frontendPath, 'src', 'test');
  await fs.ensureDir(testPath);

  const testSetup = `import '@testing-library/jest-dom'
`;

  await fs.writeFile(path.join(testPath, 'setup.ts'), testSetup);

  // Create example test
  const testExample = `import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home Page', () => {
  it('renders welcome message', () => {
    render(<Home />)
    expect(screen.getByText(/Welcome to ${config.projectName}/i)).toBeInTheDocument()
  })
})
`;

  await fs.writeFile(path.join(testPath, 'page.test.tsx'), testExample);
}

