import fs from 'fs-extra';
import path from 'path';
import { ProjectConfig } from '../../types';

export async function generateSAM(backendPath: string, config: ProjectConfig): Promise<void> {
  // Create root package.json with SAM scripts
  const rootPackageJson = {
    name: `${config.projectName}-backend`,
    version: '1.0.0',
    private: true,
    scripts: {
      'build': 'sam build',
      'deploy': 'sam deploy',
      'deploy:guided': 'sam deploy --guided',
      'local': 'sam local start-api',
      'validate': 'sam validate',
      'synth': 'sam build && sam deploy --no-execute'
    },
    devDependencies: {}
  };

  await fs.writeJSON(path.join(backendPath, 'package.json'), rootPackageJson, { spaces: 2 });

  // Create template.yaml
  let templateContent = `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  ${config.projectName}
  SAM Template for ${config.projectName}

Globals:
  Function:
    Timeout: 3
    MemorySize: 128

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Runtime: nodejs18.x
      Architectures:
        - x86_64
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
        HelloWorldPost:
          Type: Api
          Properties:
            Path: /hello
            Method: post

`;

  if (config.databaseType === 'nosql') {
    templateContent += `  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ${config.projectName}Table
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

`;
  } else if (config.databaseType === 'sql') {
    templateContent += `  # Note: RDS requires VPC configuration
  # You'll need to add VPC, Subnets, and Security Groups manually
  # or use AWS RDS Proxy for serverless access

`;
  }

  templateContent += `Outputs:
  HelloWorldApi:
    Description: "API Gateway endpoint URL for Prod stage for Hello World function"
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/hello/"
  HelloWorldFunction:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt HelloWorldFunction.Arn
  HelloWorldFunctionIamRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt HelloWorldFunctionRole.Arn
`;

  await fs.writeFile(path.join(backendPath, 'template.yaml'), templateContent);

  // Create hello-world function
  const helloWorldPath = path.join(backendPath, 'hello-world');
  await fs.ensureDir(helloWorldPath);

  const packageJson = {
    name: 'hello-world',
    version: '1.0.0',
    description: 'Hello World SAM Lambda function',
    main: 'app.js',
    scripts: {
      test: 'node tests/unit/test-handler.js'
    },
    dependencies: {}
  };

  if (config.databaseType === 'nosql') {
    packageJson.dependencies = {
      '@aws-sdk/client-dynamodb': '^3.699.0',
      '@aws-sdk/lib-dynamodb': '^3.699.0'
    };
  }

  await fs.writeJSON(path.join(helloWorldPath, 'package.json'), packageJson, { spaces: 2 });

  let appJs = `exports.lambdaHandler = async (event) => {
    try {
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Hello from ${config.projectName}!',
                input: event,
            }),
        };
        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
};
`;

  if (config.databaseType === 'nosql') {
    appJs = `const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '${config.projectName}Table';

exports.lambdaHandler = async (event) => {
    try {
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Hello from ${config.projectName}!',
                input: event,
            }),
        };
        return response;
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
`;
  }

  await fs.writeFile(path.join(helloWorldPath, 'app.js'), appJs);

  // Create test directory and test file
  const testsPath = path.join(helloWorldPath, 'tests', 'unit');
  await fs.ensureDir(testsPath);

  const testFile = `import { describe, it, expect } from 'vitest';
const app = require('../../app');

describe('Tests index', () => {
    it('verifies successful response', async () => {
        const event = {
            httpMethod: 'GET',
            path: '/hello'
        };
        const context = {};
        
        const result = await app.lambdaHandler(event, context);
        
        expect(result).toBeDefined();
        expect(result.statusCode).toBe(200);
        
        const response = JSON.parse(result.body);
        expect(response.message).toBeDefined();
    });
});
`;

  await fs.writeFile(path.join(testsPath, 'test-handler.js'), testFile);

  // Create package.json for tests
  const testPackageJson = {
    name: 'hello-world-tests',
    version: '1.0.0',
    scripts: {
      test: 'vitest',
      'test:ui': 'vitest --ui',
      'test:coverage': 'vitest --coverage'
    },
    dependencies: {
      'aws-sdk': '^2.814.0'
    },
    devDependencies: {
      'vitest': '^2.1.3',
      '@vitest/ui': '^2.1.3',
      '@vitest/coverage-v8': '^2.1.3'
    }
  };

  await fs.writeJSON(path.join(testsPath, 'package.json'), testPackageJson, { spaces: 2 });

  // Create samconfig.toml
  const samConfig = `version = 0.1

[default]
[default.global.parameters]
stack_name = "${config.projectName}"

[default.build.parameters]
cached = true
parallel = true

[default.validate.parameters]
lint = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
region = "us-east-1"
`;

  await fs.writeFile(path.join(backendPath, 'samconfig.toml'), samConfig);

  // Create README
  const readme = `# AWS SAM Backend

This is an AWS SAM project for serverless deployment.

## Prerequisites

- AWS CLI configured
- SAM CLI installed (\`pip install aws-sam-cli\`)

## Build and Deploy

\`\`\`bash
npm run build
npm run deploy:guided
\`\`\`

## Local Development

\`\`\`bash
npm run local
\`\`\`

## Useful Commands

- \`npm run build\` - Build your application
- \`npm run local\` - Start local API Gateway
- \`npm run deploy:guided\` - Deploy your application with guided prompts
- \`npm run deploy\` - Deploy your application
- \`npm run validate\` - Validate SAM template
- \`sam logs -n HelloWorldFunction --stack-name ${config.projectName} --tail\` - View logs
`;

  await fs.writeFile(path.join(backendPath, 'README.md'), readme);
}

