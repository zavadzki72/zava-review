/**
 * Analyze All Files command
 */

import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { loadConfig, parseDiff, analyze, findConfigFile } from '@zava-review/core';
import { generateReport, openReport } from '../report/generator.js';
import { getApiKey } from '../utils/secrets.js';

export async function analyzeAllCommand(context: vscode.ExtensionContext): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Zava Review: Analyzing all files...',
            cancellable: false,
        },
        async (progress) => {
            try {
                progress.report({ message: 'Loading configuration...' });

                // Find and load config
                const configPath = findConfigFile(workspacePath);
                if (!configPath) {
                    vscode.window.showErrorMessage(
                        'No zava-review.yml found. Create one in your workspace root.'
                    );
                    return;
                }

                const config = loadConfig(configPath);

                // Set API key from secret storage
                await setApiKey(context, config.ai.provider);

                progress.report({ message: 'Getting file changes...' });

                // Get all tracked files diff against empty tree (full file content)
                // This is a "full analysis" - we analyze all files as if they were all new
                let diffContent: string;
                try {
                    // Get diff of all tracked files
                    diffContent = execSync(
                        'git diff --cached HEAD -- || git diff HEAD --',
                        { cwd: workspacePath, encoding: 'utf-8' }
                    );

                    // If no staged/committed changes, diff all files
                    if (!diffContent.trim()) {
                        diffContent = execSync(
                            'git diff 4b825dc642cb6eb9a060e54bf8d69288fbee4904 HEAD --',
                            { cwd: workspacePath, encoding: 'utf-8' }
                        );
                    }
                } catch {
                    vscode.window.showErrorMessage('Failed to get git diff');
                    return;
                }

                if (!diffContent.trim()) {
                    vscode.window.showInformationMessage('No files to analyze');
                    return;
                }

                const diffFiles = parseDiff(diffContent);
                progress.report({ message: `Analyzing ${diffFiles.length} file(s)...` });

                // Run analysis (debug: true to log prompt)
                const result = await analyze({
                    config,
                    diffFiles,
                    basePath: workspacePath,
                    debug: true,  // Log prompt to console
                });

                progress.report({ message: 'Generating report...' });

                // Generate and open report
                const reportPath = await generateReport(result, workspacePath, 'full-analysis');
                await openReport(reportPath);

                // Show summary
                const msg = `Analysis complete: ${result.metadata.totalFindings} findings ` +
                    `(${result.metadata.bySeverity.critical} critical, ` +
                    `${result.metadata.bySeverity.warning} warnings)`;
                vscode.window.showInformationMessage(msg);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
    );
}

async function setApiKey(context: vscode.ExtensionContext, provider: string): Promise<void> {
    const key = await getApiKey(context, provider);
    if (key) {
        switch (provider) {
            case 'claude':
                process.env.ANTHROPIC_API_KEY = key;
                break;
            case 'openai':
                process.env.OPENAI_API_KEY = key;
                break;
            case 'gemini':
                process.env.GOOGLE_API_KEY = key;
                break;
        }
    }
}
