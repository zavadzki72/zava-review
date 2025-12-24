/**
 * Configuration types for zava-review
 */

export type AIProviderName = 'claude' | 'openai' | 'gemini';

export interface RuleConfig {
    cleanCode?: boolean;
    solid?: boolean;
    performance?: boolean;
    security?: boolean;
    readability?: boolean;
}

export interface DocumentationConfig {
    /** Path to project documentation markdown file */
    project?: string;
    /** Path to architecture/code standards markdown file */
    architecture?: string;
}

export interface AIProviderConfig {
    /** AI provider to use */
    provider: AIProviderName;
    /** Model identifier (provider-specific) */
    model: string;
}

export interface ZavaConfig {
    /** Programming languages used in the project */
    languages: string[];
    /** Analysis rule flags */
    rules: RuleConfig;
    /** Documentation paths for context */
    documentation?: DocumentationConfig;
    /** AI provider configuration */
    ai: AIProviderConfig;
    /** Custom prompt instructions */
    customPrompt?: string;
}
