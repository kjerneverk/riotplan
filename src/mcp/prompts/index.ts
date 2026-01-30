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
            name: 'explore_idea',
            description: 'Explore a new idea collaboratively without premature commitment. Capture thoughts, constraints, questions, and evidence.',
            arguments: [
                {
                    name: 'code',
                    description: 'Idea identifier (kebab-case, e.g., "real-time-notifications")',
                    required: false,
                },
                {
                    name: 'description',
                    description: 'Initial concept description',
                    required: false,
                },
            ],
        },
        {
            name: 'shape_approach',
            description: 'Compare different approaches and make decisions before building detailed plans. Surface tradeoffs and gather evidence.',
            arguments: [
                {
                    name: 'path',
                    description: 'Path to idea or shaping directory',
                    required: false,
                },
            ],
        },
        {
            name: 'create_plan',
            description: 'Create a new plan with AI-generated steps for a complex task (use after shaping)',
            arguments: [
                {
                    name: 'code',
                    description: 'Plan code/identifier (e.g., "auth-system", "dark-mode")',
                    required: false,
                },
                {
                    name: 'description',
                    description: 'Detailed description of what you want to accomplish',
                    required: false,
                },
                {
                    name: 'directory',
                    description: 'Parent directory where the plan should be created (e.g., "./plans")',
                    required: false,
                },
                {
                    name: 'steps',
                    description: 'Number of steps to generate (optional, AI will determine if not specified)',
                    required: false,
                },
            ],
        },
        {
            name: 'develop_plan',
            description: 'Refine a generated plan through conversational feedback. Captures full narrative of plan evolution with checkpoints.',
            arguments: [
                {
                    name: 'path',
                    description: 'Path to the plan directory to develop',
                    required: false,
                },
            ],
        },
        {
            name: 'execute_plan',
            description: 'Execute a plan with intelligent state management. Automatically determines next step, guides through tasks, and manages execution state.',
            arguments: [
                {
                    name: 'path',
                    description: 'Path to the plan directory to execute',
                    required: false,
                },
            ],
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
    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
    }

    // Load and fill template
    const template = loadTemplate(name);

    // Set default values for common arguments if missing
    const filledArgs = { ...args };
    
    // For explore_idea, mark missing fields
    if (name === 'explore_idea') {
        if (!filledArgs.code) filledArgs.code = '[idea-code]';
        if (!filledArgs.description) filledArgs.description = '[initial concept]';
    }
    
    // For create_plan, mark missing required fields
    if (name === 'create_plan') {
        if (!filledArgs.code) filledArgs.code = '[code]';
        if (!filledArgs.description) filledArgs.description = '[description]';
        if (!filledArgs.directory) filledArgs.directory = '[directory]';
        if (!filledArgs.steps) filledArgs.steps = '[steps]';
    }
    
    // For other prompts, use defaults
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
