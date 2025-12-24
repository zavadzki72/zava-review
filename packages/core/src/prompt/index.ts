/**
 * Prompt builder for code review
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ZavaConfig } from '../config/types.js';
import type { DiffFile } from '../diff/types.js';
import { formatDiffForPrompt } from '../diff/index.js';

/**
 * Build the analysis prompt for the AI provider
 */
export function buildPrompt(config: ZavaConfig, diffFiles: DiffFile[], basePath?: string): string {
    const sections: string[] = [];

    // Header
    sections.push('# Code Review Request\n');
    sections.push('Please analyze the following code diff and provide feedback.\n');

    // Context: Languages
    sections.push(`## Languages\n${config.languages.join(', ')}\n`);

    // Context: Rules
    sections.push(buildRulesSection(config));

    // Context: Project documentation
    if (config.documentation && basePath) {
        sections.push(buildDocumentationSection(config.documentation, basePath));
    }

    // Custom prompt
    if (config.customPrompt) {
        sections.push(`## Custom Instructions\n${config.customPrompt}\n`);
    }

    // Diff content
    sections.push('## Code Diff\n');
    sections.push(formatDiffForPrompt(diffFiles));

    // Output format instructions
    sections.push(buildOutputInstructions());

    return sections.join('\n');
}

function buildRulesSection(config: ZavaConfig): string {
    const rules = config.rules;
    const activeRules: string[] = [];

    if (rules.cleanCode) activeRules.push('Clean Code principles');
    if (rules.solid) activeRules.push('SOLID principles');
    if (rules.performance) activeRules.push('Performance optimizations');
    if (rules.security) activeRules.push('Security vulnerabilities');
    if (rules.readability) activeRules.push('Code readability and maintainability');

    if (activeRules.length === 0) {
        return '## Analysis Focus\nGeneral code quality review.\n';
    }

    return `## Analysis Focus\nFocus on: ${activeRules.join(', ')}.\n`;
}

function buildDocumentationSection(
    docs: { project?: string; architecture?: string },
    basePath: string
): string {
    const sections: string[] = ['## Project Context\n'];

    if (docs.project) {
        const content = loadDocFile(docs.project, basePath);
        if (content) {
            sections.push('### Project Documentation\n');
            sections.push(content);
            sections.push('\n');
        }
    }

    if (docs.architecture) {
        const content = loadDocFile(docs.architecture, basePath);
        if (content) {
            sections.push('### Architecture Standards\n');
            sections.push(content);
            sections.push('\n');
        }
    }

    return sections.length > 1 ? sections.join('\n') : '';
}

function loadDocFile(filePath: string, basePath: string): string | null {
    try {
        const fullPath = path.resolve(basePath, filePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf-8');
        }
    } catch {
        // Ignore errors loading documentation
    }
    return null;
}

function buildOutputInstructions(): string {
    return `
## Response Format

Respond with a JSON object containing:

\`\`\`json
{
  "summary": "Brief overall summary of the code quality",
  "findings": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "severity": "warning",
      "rule": "cleanCode",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ]
}
\`\`\`

Severity levels:
- "info": Minor suggestions or best practices
- "warning": Issues that should be addressed
- "critical": Security vulnerabilities or serious bugs

Rules:
- cleanCode: Clean Code violations
- solid: SOLID principle violations
- performance: Performance issues
- security: Security vulnerabilities
- readability: Readability improvements

Only include findings for actual issues. Be concise and actionable.
`;
}
