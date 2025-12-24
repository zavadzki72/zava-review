/**
 * Claude (Anthropic) AI Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIResponse, AIProviderOptions } from './types.js';
import { parseAIResponse } from './response-parser.js';

export class ClaudeProvider implements AIProvider {
    readonly name = 'claude' as const;
    private client: Anthropic;
    private model: string;
    private maxTokens: number;

    constructor(options: AIProviderOptions) {
        const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude provider');
        }

        this.client = new Anthropic({ apiKey });
        this.model = options.model;
        this.maxTokens = options.maxTokens ?? 4096;
    }

    async analyze(prompt: string): Promise<AIResponse> {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            system: 'You are an expert code reviewer. Analyze the provided code diff and return your findings in the specified JSON format. Be concise, actionable, and focus on the most important issues.',
        });

        const textContent = response.content.find(c => c.type === 'text');
        const rawResponse = textContent?.text ?? '';

        const { findings, summary } = parseAIResponse(rawResponse);

        return {
            findings,
            summary,
            rawResponse,
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            },
        };
    }
}
