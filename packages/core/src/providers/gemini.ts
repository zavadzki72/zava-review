/**
 * Gemini (Google) AI Provider
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, AIResponse, AIProviderOptions } from './types.js';
import { parseAIResponse } from './response-parser.js';

export class GeminiProvider implements AIProvider {
    readonly name = 'gemini' as const;
    private client: GoogleGenerativeAI;
    private model: string;
    private maxTokens: number;

    constructor(options: AIProviderOptions) {
        const apiKey = options.apiKey ?? process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY environment variable is required for Gemini provider');
        }

        this.client = new GoogleGenerativeAI(apiKey);
        this.model = options.model;
        this.maxTokens = options.maxTokens ?? 4096;
    }

    async analyze(prompt: string): Promise<AIResponse> {
        const model = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: 'You are an expert code reviewer. Analyze the provided code diff and return your findings in the specified JSON format. Be concise, actionable, and focus on the most important issues.',
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: this.maxTokens,
            },
        });

        const rawResponse = result.response.text();
        const { findings, summary } = parseAIResponse(rawResponse);

        const usageMetadata = result.response.usageMetadata;

        return {
            findings,
            summary,
            rawResponse,
            usage: usageMetadata ? {
                inputTokens: usageMetadata.promptTokenCount ?? 0,
                outputTokens: usageMetadata.candidatesTokenCount ?? 0,
            } : undefined,
        };
    }
}
