/**
 * Zava Review VSCode Extension
 */

import * as vscode from 'vscode';
import { analyzeAllCommand } from './commands/analyzeAll.js';
import { analyzeChangesCommand } from './commands/analyzeChanges.js';
import { configureCommand } from './commands/configure.js';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Zava Review extension is now active');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('zava-review.analyzeAll', () =>
            analyzeAllCommand(context)
        ),
        vscode.commands.registerCommand('zava-review.analyzeChanges', () =>
            analyzeChangesCommand(context)
        ),
        vscode.commands.registerCommand('zava-review.configure', () =>
            configureCommand(context)
        )
    );
}

export function deactivate(): void {
    console.log('Zava Review extension is now deactivated');
}
