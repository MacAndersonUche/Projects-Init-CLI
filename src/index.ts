#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { promptUser } from './prompts';
import { generateProject } from './generator';

const program = new Command();

program
  .name('projects-init')
  .description('CLI tool to initialize projects with customizable tech stacks')
  .version('2.1.0')
  .action(async () => {
    try {
      console.log(chalk.blue.bold('\n🚀 Project Initializer CLI\n'));
      
      const answers = await promptUser();
      await generateProject(answers);
      
      console.log(chalk.green.bold('\n✅ Project created successfully!'));
      console.log(chalk.yellow('\nNext steps:'));
      if (answers.projectLayout === 'folder') {
        console.log(chalk.white(`  cd ${answers.projectName}`));
      }
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm run dev'));
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error);
      process.exit(1);
    }
  });

program.parse();

