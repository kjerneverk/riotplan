/**
 * MCP Prompt Handlers
 *
 * Provides workflow templates via MCP prompts.
 * Prompts are loaded from external markdown files in this directory.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McpPrompt, McpPromptMessage } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper to resolve the prompts directory path
 * When bundled, the MCP server is at dist/mcp-server.js and prompts are at dist/mcp/prompts/
 * When running from source, prompts are at src/mcp/prompts/
 */
function getPromptsDir(): string {
    // Check if we're running from a bundled file (dist/mcp-server.js)
    const isBundled = __dirname.includes('/dist') || __dirname.endsWith('dist') ||
                      __filename.includes('dist/mcp-server.js') || __filename.includes('dist\\mcp-server.js');

    if (isBundled) {
        // When bundled, prompts are at dist/mcp/prompts/
        return resolve(__dirname, 'mcp/prompts');
    }
    // When running from source, prompts are in the same directory as this file
    return __dirname;
}

/**
 * Helper to load a prompt template from a markdown file
 */
function loadTemplate(name: string): string {
    const promptsDir = getPromptsDir();
    const path = resolve(promptsDir, `${name}.md`);
    try {
        return readFileSync(path, 'utf-8').trim();
    } catch (error) {
        throw new Error(`Failed to load prompt template "${name}" from ${path}: ${error}`);
    }
}

/**
 * Helper to replace placeholders in a template
 */
function fillTemplate(template: string, args: Record<string, string>): string {
    return template.replace(/\${(\w+)}/g, (_, key) => {
        return args[key] || `[${key}]`;
    });
}

/**
 * Get all available prompts
 */
export function getPrompts(): McpPrompt[] {
    return [
        {
            name: 'create_plan',
            description: 'Create a new plan with AI-generated steps for a complex task',
            arguments: [],
        },
        {
            name: 'execute_step',
            description: 'Execute a single step from a plan with proper status tracking',
            arguments: [
                {
                    name: 'path',
                    description: 'Plan directory path',
                    required: false,
                },
            ],
        },
        {
            name: 'track_progress',
            description: 'Monitor plan progress and maintain status tracking',
            arguments: [
                {
                    name: 'path',
                    description: 'Plan directory path',
                    required: false,
                },
            ],
        },
    ];
}

/**
 * Get a prompt by name
 */
export async function getPrompt(
    name: string,
    args: Record<string, string>
): Promise<McpPromptMessage[]> {
    // Validate prompt exists
    const prompts = getPrompts();
    if (!prompts.find(p => p.name === name)) {
        throw new Error(`Unknown prompt: ${name}`);
    }

    // Load and fill template
    const template = loadTemplate(name);

    // Set default values for common arguments if missing
    const filledArgs = { ...args };
    if (!filledArgs.path) {
        filledArgs.path = 'current directory';
    }

    const content = fillTemplate(template, filledArgs);

    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: content,
            },
        },
    ];
}
