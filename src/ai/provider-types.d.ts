/**
 * Type declarations for optional peer dependencies
 */

declare module '@kjerneverk/execution-anthropic' {
    export function createAnthropicProvider(): any;
}

declare module '@kjerneverk/execution-openai' {
    export function createOpenAIProvider(): any;
}

declare module '@kjerneverk/execution-gemini' {
    export function createGeminiProvider(): any;
}
