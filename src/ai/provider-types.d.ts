/**
 * Type declarations for optional peer dependencies
 */

declare module '@riotprompt/execution-anthropic' {
    export function createAnthropicProvider(): any;
}

declare module '@riotprompt/execution-openai' {
    export function createOpenAIProvider(): any;
}

declare module '@riotprompt/execution-gemini' {
    export function createGeminiProvider(): any;
}
