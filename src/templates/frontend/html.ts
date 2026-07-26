import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';
import { FRONTEND_PACKAGES, PKG, RECOMMENDED_NODE } from '../shared/constants';
import { withEngines } from '../shared/node-config';

export async function generateHTML(frontendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = withEngines({
    name: `${config.projectName}-frontend`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    devDependencies: {
      vite: FRONTEND_PACKAGES.vite,
      tailwindcss: PKG.tailwindcss,
      postcss: PKG.postcss,
      autoprefixer: PKG.autoprefixer
    }
  });

  await fs.writeJSON(path.join(frontendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create Vite config
  const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  // Vite config for HTML project
})
`;

  await fs.writeFile(path.join(frontendPath, 'vite.config.js'), viteConfig);

  // Create Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js}",
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

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.projectName}</title>
  <link rel="stylesheet" href="/src/styles.css">
</head>
<body>
  <main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">
        Welcome to ${config.projectName}
      </h1>
      <p class="text-gray-600 mb-6">
        Your HTML application with Tailwind CSS is ready!
      </p>
      <div class="space-y-2">
        <div class="flex items-center text-sm text-gray-500">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          HTML5
        </div>
        <div class="flex items-center text-sm text-gray-500">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Tailwind CSS
        </div>
        <div class="flex items-center text-sm text-gray-500">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Vite
        </div>
      </div>
    </div>
  </main>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;

  await fs.writeFile(path.join(frontendPath, 'index.html'), indexHtml);

  // Create src directory
  const srcPath = path.join(frontendPath, 'src');
  await fs.ensureDir(srcPath);

  // Create styles.css
  const stylesCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  await fs.writeFile(path.join(srcPath, 'styles.css'), stylesCss);

  // Create main.js
  const mainJs = `// Your JavaScript code here
console.log('${config.projectName} is ready!');
`;

  await fs.writeFile(path.join(srcPath, 'main.js'), mainJs);

  // Create deployment files
  await generateFrontendDeployment(frontendPath, config);
}

async function generateFrontendDeployment(frontendPath: string, config: ProjectConfig): Promise<void> {
  // Netlify configuration
  const netlifyToml = `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "${RECOMMENDED_NODE}"
`;

  await fs.writeFile(path.join(frontendPath, 'netlify.toml'), netlifyToml);

  // Render configuration
  const renderYaml = `services:
  - type: web
    name: ${config.projectName}-frontend
    env: node
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: NODE_ENV
        value: production
`;

  await fs.writeFile(path.join(frontendPath, 'render.yaml'), renderYaml);
}

