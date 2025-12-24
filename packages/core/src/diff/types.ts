/**
 * Diff parsing types
 */

export type DiffLineType = 'add' | 'remove' | 'context';
export type DiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface DiffLine {
    /** Type of change */
    type: DiffLineType;
    /** Line content (without +/- prefix) */
    content: string;
    /** Line number in old file (null for additions) */
    oldLineNumber: number | null;
    /** Line number in new file (null for deletions) */
    newLineNumber: number | null;
}

export interface DiffHunk {
    /** Starting line in old file */
    oldStart: number;
    /** Number of lines in old file */
    oldLines: number;
    /** Starting line in new file */
    newStart: number;
    /** Number of lines in new file */
    newLines: number;
    /** Hunk header (e.g., function name) */
    header?: string;
    /** Lines in this hunk */
    lines: DiffLine[];
}

export interface DiffFile {
    /** Original file path (a/ prefix removed) */
    oldPath: string;
    /** New file path (b/ prefix removed) */
    newPath: string;
    /** File status */
    status: DiffFileStatus;
    /** Diff hunks */
    hunks: DiffHunk[];
}
