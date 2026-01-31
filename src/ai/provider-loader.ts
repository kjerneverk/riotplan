/**
 * Provider Loader
 * 
 * Dynamically loads LLM providers based on availability
 */

import type { Provider } from '../types.js';

export interface ProviderConfig {
    name: string;
    apiKey?: string;
    model?: string;
}

/**
 * Load a provider by name
 */
export async function loadProvider(config: ProviderConfig): Promise<Provider> {
    const { name, apiKey } = config;
    
    try {
        switch (name.toLowerCase()) {
            case 'anthropic':
            case 'claude':
                return await loadAnthropicProvider(apiKey);
            
            case 'openai':
            case 'gpt':
                return await loadOpenAIProvider(apiKey);
            
            case 'gemini':
            case 'google':
                return await loadGeminiProvider(apiKey);
            
            default:
                throw new Error(`Unknown provider: ${name}`);
        }
    } catch (error) {
        if (error instanceof Error && (error.message.includes('Cannot find package') || error.message.includes('Cannot find module'))) {
            throw new Error(
                `Provider '${name}' is not installed. Install it with:\n` +
                `  npm install @kjerneverk/execution-${name}\n\n` +
                `Note: If you're using RiotPlan via MCP (e.g., in Cursor), consider using manual step creation ` +
                `with riotplan_step_add instead of riotplan_generate to avoid needing separate AI providers.`
            );
        }
        throw error;
    }
}

async function loadAnthropicProvider(_apiKey?: string): Promise<Provider> {
    const { createAnthropicProvider } = await import('@kjerneverk/execution-anthropic');
    return createAnthropicProvider();
}

async function loadOpenAIProvider(_apiKey?: string): Promise<Provider> {
    const { createOpenAIProvider } = await import('@kjerneverk/execution-openai');
    return createOpenAIProvider();
}

async function loadGeminiProvider(_apiKey?: string): Promise<Provider> {
    const { createGeminiProvider } = await import('@kjerneverk/execution-gemini');
    return createGeminiProvider();
}

/**
 * Detect available providers
 */
export async function detectAvailableProviders(): Promise<string[]> {
    const providers: string[] = [];
    
    const candidates = [
        { name: 'anthropic', pkg: '@kjerneverk/execution-anthropic' },
        { name: 'openai', pkg: '@kjerneverk/execution-openai' },
        { name: 'gemini', pkg: '@kjerneverk/execution-gemini' },
    ];
    
    for (const candidate of candidates) {
        try {
            await import(candidate.pkg);
            providers.push(candidate.name);
        } catch {
            // Provider not available
        }
    }
    
    return providers;
}

/**
 * Get default provider based on environment variables
 */
export function getDefaultProvider(): string | null {
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    if (process.env.GOOGLE_API_KEY) return 'gemini';
    return null;
}

/**
 * Get API key for a provider from environment
 */
export function getProviderApiKey(provider: string): string | undefined {
    switch (provider.toLowerCase()) {
        case 'anthropic':
        case 'claude':
            return process.env.ANTHROPIC_API_KEY;
        case 'openai':
        case 'gpt':
            return process.env.OPENAI_API_KEY;
        case 'gemini':
        case 'google':
            return process.env.GOOGLE_API_KEY;
        default:
            return undefined;
    }
}
