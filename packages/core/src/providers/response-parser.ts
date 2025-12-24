/**
 * Response parser for AI provider outputs
 */

import type { Finding, Severity } from '../analysis/types.js';

interface ParsedResponse {
    findings: Finding[];
    summary: string;
}

/**
 * Parse AI response text into structured findings
 * Expects JSON format with 'findings' array and 'summary' string
 */
export function parseAIResponse(rawResponse: string): ParsedResponse {
    // Try to extract JSON from the response
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawResponse.match(/\{[\s\S]*"findings"[\s\S]*\}/);

    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : rawResponse;

    try {
        const parsed = JSON.parse(jsonStr.trim());

        const findings: Finding[] = (parsed.findings ?? []).map((f: RawFinding) => ({
            file: f.file ?? '',
            line: typeof f.line === 'number' ? f.line : parseInt(String(f.line ?? '0'), 10) || 0,
            severity: validateSeverity(f.severity),
            message: f.message ?? '',
            rule: f.rule ?? 'general',
            suggestion: f.suggestion,
        }));

        return {
            findings,
            summary: parsed.summary ?? 'No summary provided.',
        };
    } catch {
        // If JSON parsing fails, try to extract findings from text
        return parseTextResponse(rawResponse);
    }
}

interface RawFinding {
    file?: string;
    line?: number | string;
    severity?: string;
    message?: string;
    rule?: string;
    suggestion?: string;
}

function validateSeverity(value: unknown): Severity {
    if (value === 'info' || value === 'warning' || value === 'critical') {
        return value;
    }
    return 'info';
}

/**
 * Fallback parser for non-JSON responses
 */
function parseTextResponse(text: string): ParsedResponse {
    const findings: Finding[] = [];
    const lines = text.split('\n');

    // Simple heuristic: look for patterns like "File: ... Line: ... Issue: ..."
    let currentFile = '';

    for (const line of lines) {
        // Try to extract file reference
        const fileMatch = line.match(/(?:File|file)[:\s]+([^\s,]+)/);
        if (fileMatch) {
            currentFile = fileMatch[1];
        }

        // Try to extract line number and issue
        const lineMatch = line.match(/(?:Line|line|L)[:\s]+(\d+)/);
        const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : 0;

        // Look for severity indicators
        let severity: Severity = 'info';
        if (/critical|error|severe/i.test(line)) severity = 'critical';
        else if (/warning|warn|caution/i.test(line)) severity = 'warning';

        // If line seems to describe an issue
        if (line.includes(':') && lineNum > 0) {
            findings.push({
                file: currentFile,
                line: lineNum,
                severity,
                message: line.trim(),
                rule: 'parsed',
            });
        }
    }

    return {
        findings,
        summary: findings.length > 0
            ? `Found ${findings.length} potential issues.`
            : 'No structured findings could be extracted from the response.',
    };
}
