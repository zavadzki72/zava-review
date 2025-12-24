/**
 * Secret storage utilities
 */

import * as vscode from 'vscode';

const KEY_PREFIX = 'zava-review.apiKey.';

/**
 * Get API key from secret storage
 */
export async function getApiKey(
    context: vscode.ExtensionContext,
    provider: string
): Promise<string | undefined> {
    return context.secrets.get(KEY_PREFIX + provider);
}

/**
 * Set API key in secret storage
 */
export async function setApiKey(
    context: vscode.ExtensionContext,
    provider: string,
    key: string
): Promise<void> {
    await context.secrets.store(KEY_PREFIX + provider, key);
}

/**
 * Delete API key from secret storage
 */
export async function deleteApiKey(
    context: vscode.ExtensionContext,
    provider: string
): Promise<void> {
    await context.secrets.delete(KEY_PREFIX + provider);
}
