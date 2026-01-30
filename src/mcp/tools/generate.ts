/**
 * Generate Tool - Generate plan from existing prompt
 */

import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { formatError, createSuccess } from './shared.js';
import { generatePlan } from '../../ai/generator.js';
import { loadProvider } from '../../ai/provider-loader.js';

export const generateTool: McpTool = {
    name: 'riotplan_generate',
    description:
        'Generate plan content using AI. ' +
        'Creates detailed, actionable steps from a description.',
    inputSchema: {
        type: 'object',
        properties: {
            description: {
                type: 'string',
                description: 'Plan description/requirements',
            },
            steps: {
                type: 'number',
                description: 'Number of steps to generate (default: auto-determined)',
            },
            provider: {
                type: 'string',
                description: 'AI provider (anthropic, openai, gemini)',
            },
            model: {
                type: 'string',
                description: 'Specific model to use',
            },
        },
        required: ['description'],
    },
};

export async function executeGenerate(
    args: any,
    _context: ToolExecutionContext
): Promise<ToolResult> {
    try {
        const providerName = args.provider || 'anthropic';
        const provider = await loadProvider({
            name: providerName,
            apiKey: process.env[`${providerName.toUpperCase()}_API_KEY`],
        });
        
        const generationContext = {
            planName: 'Generated Plan',
            description: args.description,
            stepCount: args.steps,
        };
        
        const result = await generatePlan(generationContext, provider, {
            model: args.model,
        });

        return createSuccess(
            {
                summary: result.summary,
                approach: result.approach,
                stepsGenerated: result.steps.length,
                steps: result.steps.map(s => ({
                    number: s.number,
                    title: s.title,
                    objective: s.objective,
                })),
            },
            `Plan generated successfully with ${result.steps.length} steps`
        );
    } catch (error) {
        return formatError(error);
    }
}
