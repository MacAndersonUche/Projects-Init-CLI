#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { promptAugment, promptUser } from './prompts';
import { generateProject } from './generator';
import { augmentProject, detectExistingProject } from './augment';
import { installCommand } from './templates/shared/package-manager';
import { AugmentSection } from './types';

const program = new Command();

program
  .name('projects-init')
  .description('CLI tool to initialize and extend projects with customizable tech stacks')
  .version('2.6.0');

program
  .command('init', { isDefault: true })
  .description('Scaffold a new project')
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
      console.log(chalk.white(`  ${installCommand(answers.packageManager)}`));
      console.log(chalk.white(`  ${answers.packageManager} run dev`));
      console.log(chalk.yellow('\nTest commands:'));
      console.log(chalk.white(`  ${answers.packageManager} test`));
      console.log(chalk.white(`  ${answers.packageManager} run test:unit`));
      console.log(chalk.white(`  ${answers.packageManager} run test:integration`));
      console.log(chalk.white(`  ${answers.packageManager} run test:e2e`));
      console.log(chalk.white(`  ${answers.packageManager} run test:performance`));
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('add')
  .description('Add missing sections to an existing scaffolded project')
  .option('-p, --path <path>', 'Path to existing project', process.cwd())
  .option(
    '-s, --sections <sections>',
    'Comma-separated sections to add (skip interactive prompt)'
  )
  .action(async (opts: { path: string; sections?: string }) => {
    try {
      console.log(chalk.blue.bold('\n🧩 Augment existing project\n'));

      const info = await detectExistingProject(opts.path);
      console.log(chalk.white(`Project: ${info.projectName}`));
      console.log(chalk.white(`Path: ${info.projectPath}`));

      if (info.missingSections.length === 0) {
        console.log(chalk.green('All known sections are already present.'));
        return;
      }

      console.log(chalk.yellow(`Missing: ${info.missingSections.join(', ')}`));

      let sections: AugmentSection[];
      if (opts.sections) {
        sections = opts.sections
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean) as AugmentSection[];
      } else {
        sections = await promptAugment(info.missingSections);
      }

      if (sections.length === 0) {
        console.log(chalk.yellow('No sections selected.'));
        return;
      }

      await augmentProject({
        projectPath: info.projectPath,
        sections,
        packageManager: info.packageManager,
      });

      console.log(chalk.green.bold('\n✅ Project updated successfully!'));
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error);
      process.exit(1);
    }
  });

program.parse();
