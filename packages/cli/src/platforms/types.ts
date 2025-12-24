/**
 * Platform adapter types
 */

import type { Finding } from '@zava-review/core';

export type PlatformType = 'github' | 'azure-devops';

export interface PlatformAdapter {
    /** Platform name */
    readonly name: PlatformType;

    /**
     * Fetch diff content for a pull request
     * @param prId - Pull request identifier
     * @returns Unified diff content
     */
    getDiff(prId: string): Promise<string>;

    /**
     * Post review comments to a pull request
     * @param prId - Pull request identifier
     * @param findings - Findings to post as comments
     */
    postComments(prId: string, findings: Finding[]): Promise<void>;
}

export interface GitHubConfig {
    /** GitHub token (GITHUB_TOKEN env var) */
    token: string;
    /** Repository owner */
    owner: string;
    /** Repository name */
    repo: string;
}

export interface AzureDevOpsConfig {
    /** Azure DevOps PAT (AZURE_DEVOPS_TOKEN env var) */
    token: string;
    /** Organization URL */
    orgUrl: string;
    /** Project name */
    project: string;
    /** Repository ID or name */
    repositoryId: string;
}
