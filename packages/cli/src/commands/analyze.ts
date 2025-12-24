/**
 * Analyze command implementation
 */

import { Command } from 'commander';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { loadConfig, parseDiff, analyze } from '@zava-review/core';
import { createPlatformAdapter } from '../platforms/index.js';
import type { PlatformType } from '../platforms/types.js';

interface AnalyzeOptions {
    config: string;
    diff?: string;
    platform?: PlatformType;
    pr?: string;
    output?: string;
    dryRun?: boolean;
}

export const analyzeCommand = new Command('analyze')
    .description('Analyze code diff and post review comments')
    .option('-c, --config <path>', 'Path to zava-review.yml config file', './zava-review.yml')
    .option('-d, --diff <path>', 'Path to diff file (alternative to --platform)')
    .option('-p, --platform <type>', 'Platform type: github, azure-devops')
    .option('--pr <id>', 'Pull request ID (required with --platform)')
    .option('-o, --output <path>', 'Output markdown report to file')
    .option('--dry-run', 'Analyze but do not post comments')
    .action(async (options: AnalyzeOptions) => {
        try {
            console.log('🔍 zava-review: Starting analysis...\n');

            // Load configuration
            const config = loadConfig(options.config);
            console.log(`✓ Loaded config: ${options.config}`);
            console.log(`  Provider: ${config.ai.provider} (${config.ai.model})`);
            console.log(`  Languages: ${config.languages.join(', ')}`);

            // Get diff content
            let diffContent: string;

            if (options.diff) {
                // Read from file
                diffContent = fs.readFileSync(options.diff, 'utf-8');
                console.log(`✓ Loaded diff from: ${options.diff}`);
            } else if (options.platform && options.pr) {
                // Fetch from platform
                const adapter = createPlatformAdapter(options.platform);
                diffContent = await adapter.getDiff(options.pr);
                console.log(`✓ Fetched diff from ${options.platform} PR #${options.pr}`);
            } else {
                // Use git diff HEAD
                try {
                    diffContent = execSync('git diff HEAD', { encoding: 'utf-8' });
                    console.log('✓ Using git diff HEAD');
                } catch {
                    console.error('❌ No diff source specified. Use --diff or --platform');
                    process.exit(1);
                }
            }

            if (!diffContent.trim()) {
                console.log('ℹ️  No changes to analyze');
                process.exit(0);
            }

            // Parse diff
            const diffFiles = parseDiff(diffContent);
            console.log(`✓ Parsed ${diffFiles.length} file(s)\n`);

            // Run analysis
            console.log('🤖 Analyzing with AI...');
            const basePath = process.cwd();
            const result = await analyze({ config, diffFiles, basePath });

            // Output summary
            console.log('\n📊 Analysis Complete');
            console.log('─'.repeat(40));
            console.log(`Summary: ${result.summary}`);
            console.log(`Files: ${result.metadata.filesAnalyzed}`);
            console.log(`Findings: ${result.metadata.totalFindings}`);
            console.log(`  • Critical: ${result.metadata.bySeverity.critical}`);
            console.log(`  • Warning: ${result.metadata.bySeverity.warning}`);
            console.log(`  • Info: ${result.metadata.bySeverity.info}`);
            console.log(`Duration: ${result.metadata.durationMs}ms\n`);

            // Output to file if requested
            if (options.output) {
                const report = generateMarkdownReport(result);
                fs.writeFileSync(options.output, report);
                console.log(`✓ Report saved to: ${options.output}`);
            }

            // Post comments if platform specified
            if (options.platform && options.pr && !options.dryRun) {
                const adapter = createPlatformAdapter(options.platform);
                const findings = result.files.flatMap(f => f.findings);

                if (findings.length > 0) {
                    console.log(`\n📝 Posting ${findings.length} comments to ${options.platform}...`);
                    await adapter.postComments(options.pr, findings);
                    console.log('✓ Comments posted successfully');
                }
            } else if (options.dryRun) {
                console.log('ℹ️  Dry run - no comments posted');
            }

            // Exit with appropriate code
            if (result.metadata.bySeverity.critical > 0) {
                console.log('\n' + '⛔'.repeat(20));
                console.log('❌ PR BLOQUEADA: Encontrados ' + result.metadata.bySeverity.critical + ' problemas CRÍTICOS');
                console.log('   Corrija os problemas acima antes de fazer merge.');
                console.log('⛔'.repeat(20) + '\n');
                process.exit(1);
            }
        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

function generateMarkdownReport(result: import('@zava-review/core').AnalysisResult): string {
    const lines: string[] = [
        '# Code Review Report',
        '',
        `**Generated:** ${result.metadata.timestamp.toISOString()}`,
        `**Provider:** ${result.metadata.provider} (${result.metadata.model})`,
        '',
        '## Summary',
        '',
        result.summary,
        '',
        '## Statistics',
        '',
        `| Metric | Value |`,
        `|--------|-------|`,
        `| Files Analyzed | ${result.metadata.filesAnalyzed} |`,
        `| Total Findings | ${result.metadata.totalFindings} |`,
        `| Critical | ${result.metadata.bySeverity.critical} |`,
        `| Warning | ${result.metadata.bySeverity.warning} |`,
        `| Info | ${result.metadata.bySeverity.info} |`,
        '',
    ];

    // Findings by file
    for (const file of result.files) {
        if (file.findings.length === 0) continue;

        lines.push(`## ${file.path}`);
        lines.push('');

        for (const finding of file.findings) {
            const icon = finding.severity === 'critical' ? '🔴' :
                finding.severity === 'warning' ? '🟡' : '🔵';
            lines.push(`### ${icon} Line ${finding.line}: ${finding.rule}`);
            lines.push('');
            lines.push(finding.message);
            if (finding.suggestion) {
                lines.push('');
                lines.push(`**Suggestion:** ${finding.suggestion}`);
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}
