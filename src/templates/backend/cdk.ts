import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateCDK(backendPath: string, config: ProjectConfig): Promise<void> {
  const appName = config.projectName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const stackName = config.projectName.replace(/[^a-zA-Z0-9]/g, '');
  const packageJson = {
    name: `${appName}-backend`,
    version: '0.1.0',
    bin: {
      [appName]: 'bin/app.js'
    },
    scripts: {
      build: 'tsc',
      watch: 'tsc -w',
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage',
      cdk: 'cdk'
    },
    dependencies: {
      'aws-cdk-lib': '^2.169.0',
      constructs: '^10.4.2',
      'source-map-support': '^0.5.21'
    },
    devDependencies: {
      '@types/node': '^22.7.5',
      'aws-cdk': '^2.169.0',
      'ts-node': '^10.9.2',
      'typescript': '^5.6.3',
      'vitest': '^2.1.3',
      '@vitest/ui': '^2.1.3',
      '@vitest/coverage-v8': '^2.1.3'
    }
  };

  await fs.writeJSON(path.join(backendPath, 'package.json'), packageJson, { spaces: 2 });

  // Create cdk.json
  const cdkJson = {
    app: 'npx ts-node --prefer-ts-exts bin/app.ts',
    watch: {
      include: ['**'],
      exclude: [
        'README.md',
        'cdk*.json',
        '**/*.d.ts',
        '**/*.js',
        'tsconfig.json',
        'package*.json',
        'yarn.lock',
        'node_modules',
        'test'
      ]
    },
    context: {
      '@aws-cdk/aws-lambda:recognizeLayerVersion': true,
    }
  };

  await fs.writeJSON(path.join(backendPath, 'cdk.json'), cdkJson, { spaces: 2 });

  // Create TypeScript config
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['es2020'],
      declaration: true,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: false,
      inlineSourceMap: true,
      inlineSources: true,
      experimentalDecorators: true,
      strictPropertyInitialization: false,
      typeRoots: ['./node_modules/@types'],
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    exclude: ['node_modules', 'cdk.out']
  };

  await fs.writeJSON(path.join(backendPath, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // Create bin directory
  const binPath = path.join(backendPath, 'bin');
  await fs.ensureDir(binPath);

  const appTs = `#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ${stackName}Stack } from '../lib/${stackName}-stack';

const app = new cdk.App();
new ${stackName}Stack(app, '${stackName}Stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
`;

  await fs.writeFile(path.join(binPath, 'app.ts'), appTs);

  // Create lib directory
  const libPath = path.join(backendPath, 'lib');
  await fs.ensureDir(libPath);

  let stackContent = `import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
`;

  if (config.databaseType === 'sql') {
    stackContent += `import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
`;
  } else if (config.databaseType === 'nosql') {
    stackContent += `import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
`;
  }

  stackContent += `
export class ${stackName}Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

`;

  if (config.databaseType === 'sql') {
    stackContent += `    // Create VPC for RDS
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
    });

    // Create RDS Database
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      databaseName: '${config.projectName}',
      deletionProtection: false,
    });

    // Output database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
    });
`;
  } else if (config.databaseType === 'nosql') {
    stackContent += `    // Create DynamoDB Table
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Output table name
    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
    });
`;
  }

  stackContent += `  }
}
`;

  await fs.writeFile(path.join(libPath, `${stackName}-stack.ts`), stackContent);

  // Create README
  const readme = `# CDK Backend

This is an AWS CDK project for deploying infrastructure.

## Useful commands

- \`npm run build\`   compile typescript to js
- \`npm run watch\`   watch for changes and compile
- \`npm run test\`    run vitest tests
- \`npm run test:ui\` run tests with UI
- \`npm run test:coverage\` run tests with coverage
- \`npm run cdk deploy\`      deploy this stack to your default AWS account/region
- \`npm run cdk diff\`        compare deployed stack with current state
- \`npm run cdk synth\`       emits the synthesized CloudFormation template
`;

  await fs.writeFile(path.join(backendPath, 'README.md'), readme);

  // Create test directory with example test
  const testPath = path.join(backendPath, 'test');
  await fs.ensureDir(testPath);

  const testFile = `import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ${stackName}Stack } from '../lib/${stackName}-stack';

describe('${stackName}Stack', () => {
  it('has required resources', () => {
    const app = new cdk.App();
    const stack = new ${stackName}Stack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    // Add your test assertions here
    // Example: template.resourceCountIs('AWS::DynamoDB::Table', 1);
    expect(template).toBeDefined();
  });
});
`;

  await fs.writeFile(path.join(testPath, `${stackName}-stack.test.ts`), testFile);
}

