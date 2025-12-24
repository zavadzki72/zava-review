#!/usr/bin/env node
/**
 * zava-review CLI
 * AI-powered code review for pull request pipelines
 */

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';

const program = new Command();

program
    .name('zava-review')
    .description('AI-powered code review for pull request pipelines')
    .version('0.1.0');

program.addCommand(analyzeCommand);

program.parse();
