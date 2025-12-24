/**
 * Platform factory
 */

import type { PlatformAdapter, PlatformType } from './types.js';
import { GitHubAdapter } from './github.js';
import { AzureDevOpsAdapter } from './azure-devops.js';

export type { PlatformAdapter, PlatformType } from './types.js';

/**
 * Create a platform adapter
 * @param platform - Platform type
 * @returns Platform adapter instance
 */
export function createPlatformAdapter(platform: PlatformType): PlatformAdapter {
    switch (platform) {
        case 'github':
            return new GitHubAdapter();
        case 'azure-devops':
            return new AzureDevOpsAdapter();
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}

/**
 * Get available platforms
 */
export function getAvailablePlatforms(): PlatformType[] {
    return ['github', 'azure-devops'];
}
