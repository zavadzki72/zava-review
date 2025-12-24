/**
 * Azure DevOps platform adapter
 */

import * as azdev from 'azure-devops-node-api';
import type { Finding } from '@zava-review/core';
import type { PlatformAdapter, AzureDevOpsConfig } from './types.js';

export class AzureDevOpsAdapter implements PlatformAdapter {
    readonly name = 'azure-devops' as const;
    private config: AzureDevOpsConfig;

    constructor() {
        const token = process.env.AZURE_DEVOPS_TOKEN ?? process.env.SYSTEM_ACCESSTOKEN;
        if (!token) {
            throw new Error('AZURE_DEVOPS_TOKEN or SYSTEM_ACCESSTOKEN environment variable is required');
        }

        const orgUrl = process.env.AZURE_DEVOPS_ORG_URL ?? process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI;
        const project = process.env.AZURE_DEVOPS_PROJECT ?? process.env.SYSTEM_TEAMPROJECT;
        const repositoryId = process.env.AZURE_DEVOPS_REPOSITORY ?? process.env.BUILD_REPOSITORY_ID;

        if (!orgUrl || !project || !repositoryId) {
            throw new Error(
                'Azure DevOps environment variables required: ' +
                'AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT, AZURE_DEVOPS_REPOSITORY'
            );
        }

        this.config = { token, orgUrl, project, repositoryId };
    }

    private async getConnection(): Promise<azdev.WebApi> {
        const authHandler = azdev.getPersonalAccessTokenHandler(this.config.token);
        return new azdev.WebApi(this.config.orgUrl, authHandler);
    }

    async getDiff(prId: string): Promise<string> {
        const connection = await this.getConnection();
        const gitApi = await connection.getGitApi();
        const prNumber = parseInt(prId, 10);

        // Get the PR to find the source and target refs
        const pullRequest = await gitApi.getPullRequest(
            this.config.repositoryId,
            prNumber,
            this.config.project
        );

        if (!pullRequest.sourceRefName || !pullRequest.targetRefName) {
            throw new Error('Unable to get branch information from pull request');
        }

        // Get commits in the PR
        const commits = await gitApi.getPullRequestCommits(
            this.config.repositoryId,
            prNumber,
            this.config.project
        );

        if (!commits || commits.length === 0) {
            throw new Error('No commits found in pull request');
        }

        // Build diff from changes in commits
        // Note: This is a simplified approach. For production, you might want to
        // use the Azure DevOps REST API directly to get the unified diff
        const lines: string[] = [];

        for (const commit of commits) {
            if (commit.commitId) {
                const changes = await gitApi.getChanges(
                    commit.commitId,
                    this.config.repositoryId,
                    this.config.project
                );

                if (changes.changes) {
                    for (const change of changes.changes) {
                        if (change.item?.path) {
                            const changeType = change.changeType;
                            lines.push(`diff --git a${change.item.path} b${change.item.path}`);

                            // Add/Edit/Delete indicators
                            if (changeType === 1) { // Add
                                lines.push('new file mode 100644');
                            } else if (changeType === 2) { // Delete
                                lines.push('deleted file mode 100644');
                            }

                            lines.push(`--- a${change.item.path}`);
                            lines.push(`+++ b${change.item.path}`);
                            lines.push('@@ -1,1 +1,1 @@');
                            lines.push(' // Changes detected - see Azure DevOps for full diff');
                        }
                    }
                }
            }
        }

        return lines.join('\n');
    }

    async postComments(prId: string, findings: Finding[]): Promise<void> {
        const connection = await this.getConnection();
        const gitApi = await connection.getGitApi();
        const prNumber = parseInt(prId, 10);

        for (const finding of findings) {
            try {
                await gitApi.createThread(
                    {
                        comments: [
                            {
                                content: this.formatComment(finding),
                                commentType: 1, // Text
                            },
                        ],
                        status: 1, // Active
                        threadContext: {
                            filePath: `/${finding.file}`,
                            rightFileStart: {
                                line: finding.line,
                                offset: 1,
                            },
                            rightFileEnd: {
                                line: finding.line,
                                offset: 1,
                            },
                        },
                    },
                    this.config.repositoryId,
                    prNumber,
                    this.config.project
                );
            } catch (error) {
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
