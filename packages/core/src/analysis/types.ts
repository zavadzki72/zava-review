/**
 * Analysis types
 */

export type Severity = 'info' | 'warning' | 'critical';

export interface Finding {
    /** File path where the issue was found */
    file: string;
    /** Line number (in new file for additions) */
    line: number;
    /** Issue severity */
    severity: Severity;
    /** Description of the issue */
    message: string;
    /** Rule that was violated */
    rule: string;
    /** Suggested fix or improvement */
    suggestion?: string;
}

export interface FileAnalysis {
    /** File path */
    path: string;
    /** Findings for this file */
    findings: Finding[];
    /** Number of lines analyzed */
    linesAnalyzed: number;
}

export interface AnalysisMetadata {
    /** Total files analyzed */
    filesAnalyzed: number;
    /** Total findings */
    totalFindings: number;
    /** Findings by severity */
    bySeverity: {
        info: number;
        warning: number;
        critical: number;
    };
    /** AI provider used */
    provider: string;
    /** Model used */
    model: string;
    /** Analysis timestamp */
    timestamp: Date;
    /** Duration in milliseconds */
    durationMs: number;
}

export interface AnalysisResult {
    /** Analysis summary */
    summary: string;
    /** Per-file analysis results */
    files: FileAnalysis[];
    /** Analysis metadata */
    metadata: AnalysisMetadata;
}
