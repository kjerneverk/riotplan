/**
 * Create Tool - Create a new plan
 */

import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { resolveDirectory, formatError, createSuccess } from './shared.js';
import { createPlan } from '../../plan/creator.js';

export const createTool: McpTool = {
    name: 'riotplan_create',
    description:
        'Create a new plan with AI generation. ' +
        'Generates detailed, actionable plans from descriptions. ' +
        'Can optionally analyze first or generate directly.',
    inputSchema: {
        type: 'object',
        properties: {
            code: {
                type: 'string',
                description: 'Plan code/identifier (e.g., "my-feature")',
            },
            name: {
                type: 'string',
                description: 'Human-readable plan name',
            },
            description: {
                type: 'string',
                description: 'Plan description/prompt',
            },
            directory: {
                type: 'string',
                description: 'Parent directory for plan (defaults to current directory)',
            },
            steps: {
                type: 'number',
                description: 'Number of steps to generate (default: auto-determined)',
            },
            direct: {
                type: 'boolean',
                description: 'Skip analysis, generate directly (default: false)',
            },
            provider: {
                type: 'string',
                description: 'AI provider (anthropic, openai, gemini)',
            },
            model: {
                type: 'string',
                description: 'Specific model to use',
            },
            noAi: {
                type: 'boolean',
                description: 'Use templates only, no AI generation (default: false)',
            },
        },
        required: ['code', 'description'],
    },
};

export async function executeCreate(
    args: any,
    context: ToolExecutionContext
): Promise<ToolResult> {
    try {
        const parentDir = args.directory ? args.directory : resolveDirectory(args, context);
        
        // Build step configs if AI generation is requested
        let steps: Array<{ title: string; description?: string }> | undefined;
        
        // For now, create basic plan structure
        // AI generation would be added later with generatePlan integration
        const config = {
            code: args.code,
            name: args.name || args.code,
            basePath: parentDir,
            description: args.description,
            steps,
        };

        const result = await createPlan(config);

        return createSuccess(
            {
                planPath: result.path,
                code: args.code,
                stepsCreated: result.plan.steps?.length || 0,
                filesCreated: result.filesCreated || [],
            },
            `Plan "${args.code}" created successfully at ${result.path}`
        );
    } catch (error) {
        return formatError(error);
    }
}
