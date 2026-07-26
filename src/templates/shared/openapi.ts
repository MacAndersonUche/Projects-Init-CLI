import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function writeOpenApiSpec(
  backendPath: string,
  config: ProjectConfig
): Promise<void> {
  if (config.apiType !== 'rest') {
    return;
  }

  const docsPath = path.join(backendPath, 'docs');
  await fs.ensureDir(docsPath);

  const spec = `openapi: 3.1.0
info:
  title: ${config.projectName} API
  version: 1.0.0
  description: REST API for ${config.projectName}
  contact:
    name: API Support
servers:
  - url: http://localhost:3001
    description: Local development
  - url: https://api.example.com
    description: Production
tags:
  - name: Health
    description: Service health checks
  - name: API
    description: Application endpoints
paths:
  /health:
    get:
      tags: [Health]
      summary: Health check
      operationId: getHealth
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
  /api:
    get:
      tags: [API]
      summary: API welcome
      operationId: getApiRoot
      responses:
        '200':
          description: Welcome payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WelcomeResponse'
components:
  schemas:
    HealthResponse:
      type: object
      required: [status, message]
      properties:
        status:
          type: string
          example: ok
        message:
          type: string
          example: Server is running
    WelcomeResponse:
      type: object
      required: [message]
      properties:
        message:
          type: string
          example: Welcome to the REST API
`;

  await fs.writeFile(path.join(docsPath, 'openapi.yaml'), spec);

  const readme = `# API Documentation

This backend exposes a REST API documented with OpenAPI 3.1.

## Files

- \`openapi.yaml\` — canonical API specification
- Import into Swagger UI, Postman, or Insomnia

## View locally

\`\`\`bash
npx @redocly/cli preview-docs docs/openapi.yaml
\`\`\`

## Keep in sync

When you add routes, update \`docs/openapi.yaml\` and regenerate client SDKs if used.
`;

  await fs.writeFile(path.join(docsPath, 'README.md'), readme);
}
