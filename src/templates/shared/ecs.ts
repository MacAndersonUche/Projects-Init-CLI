import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';
import { RECOMMENDED_NODE } from './constants';

export async function writeEcsDeploymentFiles(
  backendPath: string,
  config: ProjectConfig
): Promise<void> {
  const dockerfile = `FROM node:${RECOMMENDED_NODE}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:${RECOMMENDED_NODE}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
`;

  await fs.writeFile(path.join(backendPath, 'Dockerfile'), dockerfile);

  const dockerignore = `node_modules
dist
.env
.env.*
*.log
.git
coverage
`;

  await fs.writeFile(path.join(backendPath, '.dockerignore'), dockerignore);

  const ecsDir = path.join(backendPath, 'deploy', 'ecs');
  await fs.ensureDir(ecsDir);

  const taskDef = {
    family: `${config.projectName}-backend`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '256',
    memory: '512',
    executionRoleArn: 'arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole',
    taskRoleArn: 'arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole',
    containerDefinitions: [
      {
        name: `${config.projectName}-backend`,
        image: 'ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/REPOSITORY:latest',
        essential: true,
        portMappings: [{ containerPort: 3001, protocol: 'tcp' }],
        environment: [{ name: 'NODE_ENV', value: 'production' }],
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': `/ecs/${config.projectName}-backend`,
            'awslogs-region': 'us-east-1',
            'awslogs-stream-prefix': 'ecs',
          },
        },
        healthCheck: {
          command: ['CMD-SHELL', 'wget -qO- http://localhost:3001/health || exit 1'],
          interval: 30,
          timeout: 5,
          retries: 3,
          startPeriod: 60,
        },
      },
    ],
  };

  await fs.writeJSON(path.join(ecsDir, 'task-definition.json'), taskDef, { spaces: 2 });

  const deployReadme = `# ECS Deployment

## Prerequisites

- AWS CLI configured
- ECR repository for the backend image
- ECS cluster + service (Fargate recommended)
- IAM roles: \`ecsTaskExecutionRole\`, \`ecsTaskRole\`

## Build and push

\`\`\`bash
docker build -t ${config.projectName}-backend .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag ${config.projectName}-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/REPOSITORY:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/REPOSITORY:latest
\`\`\`

## Deploy

Update \`deploy/ecs/task-definition.json\` placeholders, then register a new task revision and update the ECS service.

GitHub Actions deploy workflow is included when ECS deployment is selected at project creation.
`;

  await fs.writeFile(path.join(ecsDir, 'README.md'), deployReadme);
}

export function ecsDeployWorkflowSteps(config: ProjectConfig): string {
  return `
    steps:
    - uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ secrets.AWS_REGION || 'us-east-1' }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to ECR
      env:
        ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: \${{ secrets.ECR_REPOSITORY }}
        IMAGE_TAG: \${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    - name: Deploy to ECS
      uses: aws-actions/amazon-ecs-deploy-task-definition@v2
      with:
        task-definition: backend/deploy/ecs/task-definition.json
        service: \${{ secrets.ECS_SERVICE }}
        cluster: \${{ secrets.ECS_CLUSTER }}
        wait-for-service-stability: true
`;
}
