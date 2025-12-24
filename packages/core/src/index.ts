/**
 * @zava-review/core
 * Core analysis engine for zava-review
 */

// Config
export { loadConfig, validateConfig, findConfigFile } from './config/index.js';
export type { ZavaConfig, RuleConfig, DocumentationConfig, AIProviderConfig } from './config/types.js';

// Diff
export { parseDiff } from './diff/index.js';
export type { DiffFile, DiffHunk, DiffLine } from './diff/types.js';

// Providers
export { createProvider, getAvailableProviders } from './providers/index.js';
export type { AIProvider, AIResponse } from './providers/types.js';

// Analysis
export { analyze } from './analysis/index.js';
export type { AnalysisResult, FileAnalysis, Finding, Severity } from './analysis/types.js';

// Prompt
export { buildPrompt } from './prompt/index.js';
