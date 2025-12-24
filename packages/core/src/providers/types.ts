/**
 * AI Provider types
 */

import type { Finding } from '../analysis/types.js';

export type AIProviderName = 'claude' | 'openai' | 'gemini';

export interface AIResponse {
    /** Parsed findings from the AI response */
    findings: Finding[];
    /** Summary of the analysis */
    summary: string;
    /** Raw response content for debugging */
    rawResponse: string;
    /** Token usage if available */
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

export interface AIProvider {
    /** Provider name */
    readonly name: AIProviderName;

    /**
     * Analyze code diff with the given prompt
     * @param prompt - Full analysis prompt
     * @returns Analysis response
     */
    analyze(prompt: string): Promise<AIResponse>;
}

export interface AIProviderOptions {
    /** API key (defaults to environment variable) */
    apiKey?: string;
    /** Model identifier */
    model: string;
    /** Maximum tokens for response */
    maxTokens?: number;
}
