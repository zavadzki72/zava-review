/**
 * OpenAI AI Provider
 */

import OpenAI from 'openai';
import type { AIProvider, AIResponse, AIProviderOptions } from './types.js';
import { parseAIResponse } from './response-parser.js';

export class OpenAIProvider implements AIProvider {
    readonly name = 'openai' as const;
    private client: OpenAI;
    private model: string;
    private maxTokens: number;

    constructor(options: AIProviderOptions) {
        const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
        }

        this.client = new OpenAI({ apiKey });
        this.model = options.model;
        this.maxTokens = options.maxTokens ?? 4096;
    }

    async analyze(prompt: string): Promise<AIResponse> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert code reviewer. Analyze the provided code diff and return your findings in the specified JSON format. Be concise, actionable, and focus on the most important issues.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const rawResponse = response.choices[0]?.message?.content ?? '';
        const { findings, summary } = parseAIResponse(rawResponse);

        return {
            findings,
            summary,
            rawResponse,
            usage: response.usage ? {
                inputTokens: response.usage.prompt_tokens,
                outputTokens: response.usage.completion_tokens,
            } : undefined,
        };
    }
}
