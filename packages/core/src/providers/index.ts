/**
 * AI Provider factory
 */

import type { AIProvider, AIProviderName, AIProviderOptions } from './types.js';
import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';

export type { AIProvider, AIResponse, AIProviderOptions } from './types.js';

/**
 * Create an AI provider instance
 * @param name - Provider name
 * @param options - Provider options
 * @returns AI provider instance
 */
export function createProvider(name: AIProviderName, options: AIProviderOptions): AIProvider {
    switch (name) {
        case 'claude':
            return new ClaudeProvider(options);
        case 'openai':
            return new OpenAIProvider(options);
        case 'gemini':
            return new GeminiProvider(options);
        default:
            throw new Error(`Unknown AI provider: ${name}`);
    }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): AIProviderName[] {
    return ['claude', 'openai', 'gemini'];
}

/**
 * Get environment variable name for a provider's API key
 */
export function getApiKeyEnvVar(provider: AIProviderName): string {
    switch (provider) {
        case 'claude':
            return 'ANTHROPIC_API_KEY';
        case 'openai':
            return 'OPENAI_API_KEY';
        case 'gemini':
            return 'GOOGLE_API_KEY';
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
