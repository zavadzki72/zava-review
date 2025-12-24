/**
 * GitHub platform adapter
 */

import { Octokit } from '@octokit/rest';
import type { Finding } from '@zava-review/core';
import type { PlatformAdapter, GitHubConfig } from './types.js';

export class GitHubAdapter implements PlatformAdapter {
    readonly name = 'github' as const;
    private client: Octokit;
    private config: GitHubConfig;

    constructor() {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable is required');
        }

        const owner = process.env.GITHUB_REPOSITORY_OWNER ?? '';
        const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';

        if (!owner || !repo) {
            throw new Error('GITHUB_REPOSITORY_OWNER and GITHUB_REPOSITORY environment variables are required');
        }

        this.config = { token, owner, repo };
        this.client = new Octokit({ auth: token });
    }

    async getDiff(prId: string): Promise<string> {
        const prNumber = parseInt(prId, 10);

        const response = await this.client.pulls.get({
            owner: this.config.owner,
            repo: this.config.repo,
            pull_number: prNumber,
            mediaType: {
                format: 'diff',
            },
        });

        // When format is 'diff', the response data is the diff string
        return response.data as unknown as string;
    }

    async postComments(prId: string, findings: Finding[]): Promise<void> {
        const prNumber = parseInt(prId, 10);

        // Get the latest commit SHA for the PR
        const pr = await this.client.pulls.get({
            owner: this.config.owner,
            repo: this.config.repo,
            pull_number: prNumber,
        });

        const commitId = pr.data.head.sha;

        // Post each finding as a review comment
        for (const finding of findings) {
            try {
                await this.client.pulls.createReviewComment({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    pull_number: prNumber,
                    commit_id: commitId,
                    path: finding.file,
                    line: finding.line,
                    body: this.formatComment(finding),
                });
            } catch (error) {
                // Log but continue with other comments
                console.warn(`Failed to post comment for ${finding.file}:${finding.line}:`, error);
            }
        }
    }

    private formatComment(finding: Finding): string {
        const icon = finding.severity === 'critical' ? '🔴' :
            finding.severity === 'warning' ? '🟡' : '🔵';

        let comment = `${icon} **${finding.severity.toUpperCase()}** - ${finding.rule}\n\n`;
        comment += finding.message;

        if (finding.suggestion) {
            comment += `\n\n**Suggestion:** ${finding.suggestion}`;
        }

        comment += '\n\n---\n*Posted by zava-review*';

        return comment;
    }
}
