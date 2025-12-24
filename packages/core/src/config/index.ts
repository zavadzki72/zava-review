/**
 * Configuration loader and validator
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import type { ZavaConfig, AIProviderName } from './types.js';

/** Zod schema for config validation */
const ConfigSchema = z.object({
    languages: z.array(z.string()).min(1, 'At least one language is required'),
    rules: z.object({
        cleanCode: z.boolean().optional().default(true),
        solid: z.boolean().optional().default(true),
        performance: z.boolean().optional().default(true),
        security: z.boolean().optional().default(true),
        readability: z.boolean().optional().default(true),
    }).optional().default({}),
    documentation: z.object({
        project: z.string().optional(),
        architecture: z.string().optional(),
    }).optional(),
    ai: z.object({
        provider: z.enum(['claude', 'openai', 'gemini']),
        model: z.string(),
    }),
    customPrompt: z.string().optional(),
});

/**
 * Load configuration from a YAML file
 * @param configPath - Path to the YAML config file
 * @returns Parsed configuration object
 * @throws Error if file not found or parsing fails
 */
export function loadConfig(configPath: string): ZavaConfig {
    const absolutePath = path.resolve(configPath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Configuration file not found: ${absolutePath}`);
    }

    const fileContents = fs.readFileSync(absolutePath, 'utf-8');
    const rawConfig = yaml.load(fileContents);

    return validateConfig(rawConfig);
}

/**
 * Validate a raw config object against the schema
 * @param rawConfig - Raw configuration object
 * @returns Validated configuration
 * @throws ZodError if validation fails
 */
export function validateConfig(rawConfig: unknown): ZavaConfig {
    const result = ConfigSchema.parse(rawConfig);

    return {
        languages: result.languages,
        rules: {
            cleanCode: result.rules.cleanCode,
            solid: result.rules.solid,
            performance: result.rules.performance,
            security: result.rules.security,
            readability: result.rules.readability,
        },
        documentation: result.documentation,
        ai: {
            provider: result.ai.provider as AIProviderName,
            model: result.ai.model,
        },
        customPrompt: result.customPrompt,
    };
}

/**
 * Find config file in default locations
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null if not found
 */
export function findConfigFile(startDir: string): string | null {
    const configNames = ['zava-review.yml', 'zava-review.yaml', '.zava-review.yml', '.zava-review.yaml'];

    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
        for (const configName of configNames) {
            const configPath = path.join(currentDir, configName);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }
        currentDir = path.dirname(currentDir);
    }

    return null;
}
