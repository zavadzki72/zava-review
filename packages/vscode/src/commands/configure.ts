/**
 * Configure command
 */

import * as vscode from 'vscode';
import { setApiKey } from '../utils/secrets.js';

export async function configureCommand(context: vscode.ExtensionContext): Promise<void> {
    const options = [
        { label: 'Set Claude API Key', provider: 'claude' },
        { label: 'Set OpenAI API Key', provider: 'openai' },
        { label: 'Set Gemini API Key', provider: 'gemini' },
        { label: 'Create Config File', provider: null },
    ];

    const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'What would you like to configure?',
    });

    if (!selected) return;

    if (selected.provider) {
        // Set API key
        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter your ${selected.label.replace('Set ', '')}`,
            password: true,
            placeHolder: 'sk-...',
        });

        if (apiKey) {
            await setApiKey(context, selected.provider, apiKey);
            vscode.window.showInformationMessage(`${selected.provider} API key saved securely`);
        }
    } else {
        // Create config file
        await createConfigFile();
    }
}

async function createConfigFile(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const configContent = `# zava-review configuration

languages:
  - typescript
  - javascript

rules:
  cleanCode: true
  solid: true
  performance: true
  security: true
  readability: true

# Optional: paths to documentation for context
# documentation:
#   project: docs/project.md
#   architecture: docs/architecture.md

ai:
  provider: claude  # Options: claude, openai, gemini
  model: claude-sonnet-4-20250514

# Optional: custom instructions for the AI
# customPrompt: |
#   Focus on DDD patterns and avoid business logic in controllers.
`;

    const configUri = vscode.Uri.joinPath(workspaceFolder.uri, 'zava-review.yml');

    try {
        await vscode.workspace.fs.stat(configUri);
        const overwrite = await vscode.window.showWarningMessage(
            'zava-review.yml already exists. Overwrite?',
            'Yes',
            'No'
        );
        if (overwrite !== 'Yes') return;
    } catch {
        // File doesn't exist, continue
    }

    await vscode.workspace.fs.writeFile(configUri, Buffer.from(configContent));

    const doc = await vscode.workspace.openTextDocument(configUri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage('Created zava-review.yml configuration file');
}
