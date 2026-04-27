#!/usr/bin/env node

/**
 * envault - CLI entry point
 * Parses CLI arguments and dispatches to the appropriate command handler.
 */

import { Command } from 'commander';
import { runInit } from './commands/init';
import { runPush } from './commands/push';
import { runPull } from './commands/pull';
import { runList } from './commands/list';
import { runDiff } from './commands/diff';

const program = new Command();

program
  .name('envault')
  .description('Securely sync and version .env files across your team using encrypted backends.')
  .version('0.1.0');

// init command — sets up envault in the current project
program
  .command('init')
  .description('Initialize envault in the current directory')
  .option('-p, --project <name>', 'Project name to use in the vault')
  .option('-s, --storage <path>', 'Path to the local vault storage directory', '.envault')
  .action(async (options) => {
    try {
      await runInit(options.project, options.storage);
    } catch (err) {
      console.error('Error during init:', (err as Error).message);
      process.exit(1);
    }
  });

// push command — encrypts and stores the current .env file
program
  .command('push')
  .description('Encrypt and push the current .env file to the vault')
  .option('-e, --env <file>', 'Path to the .env file to push', '.env')
  .option('-m, --message <msg>', 'Optional version message / label')
  .action(async (options) => {
    try {
      await runPush(options.env, options.message);
    } catch (err) {
      console.error('Error during push:', (err as Error).message);
      process.exit(1);
    }
  });

// pull command — decrypts and restores a .env file from the vault
program
  .command('pull')
  .description('Pull and decrypt the latest .env from the vault')
  .option('-e, --env <file>', 'Destination path for the decrypted .env file', '.env')
  .option('-v, --version <id>', 'Specific version ID to pull (defaults to latest)')
  .action(async (options) => {
    try {
      await runPull(options.env, options.version);
    } catch (err) {
      console.error('Error during pull:', (err as Error).message);
      process.exit(1);
    }
  });

// list command — shows stored versions in the vault
program
  .command('list')
  .description('List all stored versions in the vault')
  .action(async () => {
    try {
      await runList();
    } catch (err) {
      console.error('Error during list:', (err as Error).message);
      process.exit(1);
    }
  });

// diff command — shows differences between two vault versions or local vs vault
program
  .command('diff')
  .description('Show diff between two vault versions or local .env vs latest vault entry')
  .option('-a, --version-a <id>', 'First version ID (or "local" to use local .env)')
  .option('-b, --version-b <id>', 'Second version ID (defaults to latest vault entry)')
  .option('-e, --env <file>', 'Path to local .env file when using "local" as version-a', '.env')
  .action(async (options) => {
    try {
      await runDiff(options.versionA ?? 'local', options.versionB, options.env);
    } catch (err) {
      console.error('Error during diff:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
