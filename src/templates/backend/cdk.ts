import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateCDK(backendPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: `${config.projectName}-backend`,
    version: '1.0.0',
    scripts: {
      build: 'tsc',
      watch: 'tsc -w',
      test: 'jest',
      cdk: 'cdk',
      'cdk:deploy': 'cdk deploy',
      'cdk:synth': 'cdk synth',
      'cdk:diff': 'cdk diff'
    },
    dependencies: {
      'aws-cdk-lib': '^2.100.0',
      constructs: '^10.3.0'
    },
    devDependencies: {
      '@types/node': '^20.10.6',
      'aws-cdk': '^2.100.0',
      'ts-node': '^10.9.2',
      typescript: '^5.3.3',
      '@types/jest': '^29.5.11',
      jest: '^29.7.0',
      'ts-jest': '^29.1.1',
      'source-map-support': '^0.5.21'
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
      '@aws-cdk/core:checkSecretUsage': true,
      '@aws-cdk/core:target-partitions': ['aws', 'aws-cn'],
      '@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver': true,
      '@aws-cdk/aws-ec2:uniqueImdsv2TemplateName': true,
      '@aws-cdk/aws-ecs:arnFormatIncludesClusterName': true,
      '@aws-cdk/aws-iam:minimizePolicies': true,
      '@aws-cdk/core:validateSnapshotRemovalPolicy': true,
      '@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName': true,
      '@aws-cdk/aws-s3:createDefaultLoggingPolicy': true,
      '@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption': true,
      '@aws-cdk/aws-apigateway:disableCloudWatchRole': true,
      '@aws-cdk/core:enablePartitionLiterals': true,
      '@aws-cdk/aws-events:eventsTargetQueueSameAccount': true,
      '@aws-cdk/aws-iam:standardizedServicePrincipals': true,
      '@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker': true,
      '@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName': true,
      '@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy': true,
      '@aws-cdk/aws-route53-patters:useCertificate': true,
      '@aws-cdk/customresources:installLatestAwsSdkDefault': false,
      '@aws-cdk/aws-rds:databaseProxyUniqueResourceName': true,
      '@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup': true,
      '@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId': true,
      '@aws-cdk/aws-ec2:launchTemplateDefaultUserData': true,
      '@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm': true
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
import { ${config.projectName}Stack } from '../lib/${config.projectName}-stack';

const app = new cdk.App();
new ${config.projectName}Stack(app, '${config.projectName}Stack', {
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
export class ${config.projectName}Stack extends cdk.Stack {
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

  await fs.writeFile(path.join(libPath, `${config.projectName}-stack.ts`), stackContent);

  // Create README
  const readme = `# CDK Backend

This is an AWS CDK project for deploying infrastructure.

## Useful commands

- \`npm run build\`   compile typescript to js
- \`npm run watch\`   watch for changes and compile
- \`npm run test\`    perform the jest unit tests
- \`cdk deploy\`      deploy this stack to your default AWS account/region
- \`cdk diff\`        compare deployed stack with current state
- \`cdk synth\`       emits the synthesized CloudFormation template
`;

  await fs.writeFile(path.join(backendPath, 'README.md'), readme);
}

