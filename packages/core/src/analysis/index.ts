/**
 * Analysis engine
 */

import type { ZavaConfig } from '../config/types.js';
import type { DiffFile } from '../diff/types.js';
import type { AnalysisResult, FileAnalysis, Finding } from './types.js';
import { createProvider } from '../providers/index.js';
import { buildPrompt } from '../prompt/index.js';

export type { AnalysisResult, FileAnalysis, Finding, Severity } from './types.js';

export interface AnalyzeOptions {
    /** Configuration */
    config: ZavaConfig;
    /** Parsed diff files */
    diffFiles: DiffFile[];
    /** Base path for resolving documentation files */
    basePath?: string;
    /** Enable debug logging (logs prompt to console) */
    debug?: boolean;
}

/**
 * Analyze code diff using the configured AI provider
 */
export async function analyze(options: AnalyzeOptions): Promise<AnalysisResult> {
    const { config, diffFiles, basePath, debug = false } = options;
    const startTime = Date.now();

    // Create AI provider
    const provider = createProvider(config.ai.provider, {
        model: config.ai.model,
    });

    // Build prompt
    const prompt = buildPrompt(config, diffFiles, basePath);

    // Debug: log the prompt
    if (debug) {
        console.log('\n' + '='.repeat(80));
        console.log('📝 GENERATED PROMPT');
        console.log('='.repeat(80));
        console.log(prompt);
        console.log('='.repeat(80) + '\n');
    }

    // Get AI response
    const response = await provider.analyze(prompt);

    // Group findings by file
    const fileMap = new Map<string, Finding[]>();

    for (const finding of response.findings) {
        const existing = fileMap.get(finding.file) ?? [];
        existing.push(finding);
        fileMap.set(finding.file, existing);
    }

    // Build file analysis results
    const files: FileAnalysis[] = [];

    for (const diffFile of diffFiles) {
        const findings = fileMap.get(diffFile.newPath) ?? [];
        const linesAnalyzed = diffFile.hunks.reduce(
            (sum, hunk) => sum + hunk.lines.filter(l => l.type !== 'context').length,
            0
        );

        files.push({
            path: diffFile.newPath,
            findings,
            linesAnalyzed,
        });
    }

    // Calculate metadata
    const bySeverity = {
        info: response.findings.filter(f => f.severity === 'info').length,
        warning: response.findings.filter(f => f.severity === 'warning').length,
        critical: response.findings.filter(f => f.severity === 'critical').length,
    };

    return {
        summary: response.summary,
        files,
        metadata: {
            filesAnalyzed: diffFiles.length,
            totalFindings: response.findings.length,
            bySeverity,
            provider: config.ai.provider,
            model: config.ai.model,
            timestamp: new Date(),
            durationMs: Date.now() - startTime,
        },
    };
}
