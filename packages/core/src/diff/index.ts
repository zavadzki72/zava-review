/**
 * Unified diff parser
 */

import type { DiffFile, DiffHunk, DiffLine, DiffLineType, DiffFileStatus } from './types.js';

/**
 * Parse a unified diff string into structured format
 * @param diffContent - Raw unified diff content
 * @returns Parsed diff files
 */
export function parseDiff(diffContent: string): DiffFile[] {
    const files: DiffFile[] = [];
    const lines = diffContent.split('\n');

    let currentFile: DiffFile | null = null;
    let currentHunk: DiffHunk | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // File header: diff --git a/path b/path
        if (line.startsWith('diff --git')) {
            if (currentFile) {
                if (currentHunk) {
                    currentFile.hunks.push(currentHunk);
                }
                files.push(currentFile);
            }

            const match = line.match(/diff --git a\/(.+) b\/(.+)/);
            if (match) {
                currentFile = {
                    oldPath: match[1],
                    newPath: match[2],
                    status: 'modified',
                    hunks: [],
                };
                currentHunk = null;
            }
            continue;
        }

        if (!currentFile) continue;

        // Detect file status
        if (line.startsWith('new file mode')) {
            currentFile.status = 'added';
            continue;
        }
        if (line.startsWith('deleted file mode')) {
            currentFile.status = 'deleted';
            continue;
        }
        if (line.startsWith('rename from')) {
            currentFile.status = 'renamed';
            continue;
        }

        // Hunk header: @@ -start,lines +start,lines @@ optional header
        if (line.startsWith('@@')) {
            if (currentHunk) {
                currentFile.hunks.push(currentHunk);
            }

            const hunkMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)?/);
            if (hunkMatch) {
                oldLineNum = parseInt(hunkMatch[1], 10);
                newLineNum = parseInt(hunkMatch[3], 10);

                currentHunk = {
                    oldStart: oldLineNum,
                    oldLines: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
                    newStart: newLineNum,
                    newLines: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
                    header: hunkMatch[5]?.trim() || undefined,
                    lines: [],
                };
            }
            continue;
        }

        if (!currentHunk) continue;

        // Diff lines
        let type: DiffLineType;
        let content: string;
        let oldLine: number | null = null;
        let newLine: number | null = null;

        if (line.startsWith('+')) {
            type = 'add';
            content = line.substring(1);
            newLine = newLineNum++;
        } else if (line.startsWith('-')) {
            type = 'remove';
            content = line.substring(1);
            oldLine = oldLineNum++;
        } else if (line.startsWith(' ') || line === '') {
            type = 'context';
            content = line.startsWith(' ') ? line.substring(1) : line;
            oldLine = oldLineNum++;
            newLine = newLineNum++;
        } else {
            // Skip other lines (e.g., \ No newline at end of file)
            continue;
        }

        const diffLine: DiffLine = {
            type,
            content,
            oldLineNumber: oldLine,
            newLineNumber: newLine,
        };

        currentHunk.lines.push(diffLine);
    }

    // Push the last file and hunk
    if (currentFile) {
        if (currentHunk) {
            currentFile.hunks.push(currentHunk);
        }
        files.push(currentFile);
    }

    return files;
}

/**
 * Format diff for display in prompts
 * @param files - Parsed diff files
 * @returns Formatted string for AI consumption
 */
export function formatDiffForPrompt(files: DiffFile[]): string {
    const parts: string[] = [];

    for (const file of files) {
        parts.push(`\n### File: ${file.newPath} (${file.status})\n`);

        for (const hunk of file.hunks) {
            if (hunk.header) {
                parts.push(`Context: ${hunk.header}`);
            }

            for (const line of hunk.lines) {
                const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
                const lineNum = line.newLineNumber ?? line.oldLineNumber ?? '?';
                parts.push(`${prefix} L${lineNum}: ${line.content}`);
            }
            parts.push('');
        }
    }

    return parts.join('\n');
}
