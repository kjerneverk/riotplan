#!/usr/bin/env node
/**
 * RiotPlan MCP Server
 *
 * Exposes riotplan commands, resources, and prompts via MCP.
 *
 * This server provides:
 * - Tools: Plan management commands (create, status, step operations, etc.)
 * - Resources: Plan data, status, steps, and step content
 * - Prompts: Workflow templates for plan creation and execution
 *
 * Uses McpServer high-level API for better progress notification support
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { executeTool } from './tools/index.js';
import { getResources, readResource } from './resources/index.js';
import { getPrompts, getPrompt } from './prompts/index.js';

/**
 * Recursively remove undefined values from an object to prevent JSON serialization issues
 * Preserves null values as they are valid in JSON
 */
function removeUndefinedValues(obj: any): any {
    if (obj === undefined) {
        return undefined;
    }
    if (obj === null) {
        return null;
    }
    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = removeUndefinedValues(value);
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
        return cleaned;
    }
    return obj;
}

async function main() {
    // Mark that we're running as MCP server
    process.env.RIOTPLAN_MCP_SERVER = 'true';

    // Initialize MCP server with high-level API
    const server = new McpServer(
        {
            name: 'riotplan',
            version: '1.0.0',
        },
        {
            capabilities: {
                tools: {},
                resources: {
                    subscribe: false,
                    listChanged: false,
                },
                prompts: {
                    listChanged: false,
                },
            },
        }
    );

    // ========================================================================
    // Tools Handlers
    // ========================================================================

    /**
     * Helper to register a tool with progress notification support
     */
    function registerTool(
        name: string,
        description: string,
        inputSchema: z.ZodRawShape
    ) {
        server.tool(
            name,
            description,
            inputSchema,
            async (args, { sendNotification, _meta }) => {
                const context = {
                    workingDirectory: process.cwd(),
                    config: undefined,
                    logger: undefined,
                    sendNotification: async (notification: {
                        method: string;
                        params: {
                            progressToken?: string | number;
                            progress: number;
                            total?: number;
                            message?: string;
                        };
                    }) => {
                        if (notification.method === 'notifications/progress' && _meta?.progressToken) {
                            const params: Record<string, any> = {
                                progressToken: _meta.progressToken,
                                progress: notification.params.progress,
                            };
                            if (notification.params.total !== undefined) {
                                params.total = notification.params.total;
                            }
                            if (notification.params.message !== undefined) {
                                params.message = notification.params.message;
                            }
                            await sendNotification({
                                method: 'notifications/progress',
                                params: removeUndefinedValues(params) as any,
                            });
                        }
                    },
                    progressToken: _meta?.progressToken,
                };

                const result = await executeTool(name, args, context);

                if (result.success) {
                    const content: Array<{ type: 'text'; text: string }> = [];

                    if (result.logs && result.logs.length > 0) {
                        content.push({
                            type: 'text' as const,
                            text: '=== Command Output ===\n' + result.logs.join('\n') + '\n\n=== Result ===',
                        });
                    }

                    const cleanData = removeUndefinedValues(result.data);
                    content.push({
                        type: 'text' as const,
                        text: JSON.stringify(cleanData, null, 2),
                    });

                    return { content };
                } else {
                    const errorParts: string[] = [];

                    if (result.logs && result.logs.length > 0) {
                        errorParts.push('=== Command Output ===');
                        errorParts.push(result.logs.join('\n'));
                        errorParts.push('\n=== Error ===');
                    }

                    errorParts.push(result.error || 'Unknown error');

                    if (result.context && typeof result.context === 'object') {
                        errorParts.push('\n=== Context ===');
                        for (const [key, value] of Object.entries(result.context)) {
                            if (value !== undefined && value !== null) {
                                errorParts.push(`${key}: ${String(value)}`);
                            }
                        }
                    }

                    if (result.details) {
                        if (result.details.stderr && result.details.stderr.trim()) {
                            errorParts.push('\n=== STDERR ===');
                            errorParts.push(result.details.stderr);
                        }
                        if (result.details.stdout && result.details.stdout.trim()) {
                            errorParts.push('\n=== STDOUT ===');
                            errorParts.push(result.details.stdout);
                        }
                    }

                    if (result.recovery && result.recovery.length > 0) {
                        errorParts.push('\n=== Recovery Steps ===');
                        errorParts.push(...result.recovery.map((step, i) => `${i + 1}. ${step}`));
                    }

                    return {
                        content: [{
                            type: 'text' as const,
                            text: errorParts.join('\n'),
                        }],
                        isError: true,
                    };
                }
            }
        );
    }

    // Register all tools
    registerTool(
        'riotplan_create',
        'Create a new plan with AI generation. Generates detailed, actionable plans from descriptions.',
        {
            code: z.string(),
            name: z.string().optional(),
            description: z.string(),
            directory: z.string().optional(),
            steps: z.number().optional(),
            direct: z.boolean().optional(),
            provider: z.string().optional(),
            model: z.string().optional(),
            noAi: z.boolean().optional(),
        }
    );

    registerTool(
        'riotplan_status',
        'Show current plan status including progress, current step, blockers, and issues.',
        {
            path: z.string().optional(),
            verbose: z.boolean().optional(),
        }
    );

    registerTool(
        'riotplan_step_list',
        'List all steps in a plan with their status. Can filter to show only pending or all steps.',
        {
            path: z.string().optional(),
            pending: z.boolean().optional(),
            all: z.boolean().optional(),
        }
    );

    registerTool(
        'riotplan_step_start',
        'Mark a step as started. Updates STATUS.md to reflect the step is in progress.',
        {
            path: z.string().optional(),
            step: z.number(),
        }
    );

    registerTool(
        'riotplan_step_complete',
        'Mark a step as completed. Updates STATUS.md to reflect the step is done.',
        {
            path: z.string().optional(),
            step: z.number(),
        }
    );

    registerTool(
        'riotplan_step_add',
        'Add a new step to the plan. Can specify position or add after a specific step.',
        {
            path: z.string().optional(),
            title: z.string(),
            number: z.number().optional(),
            after: z.number().optional(),
        }
    );

    registerTool(
        'riotplan_validate',
        'Validate plan structure and files. Checks for required files, valid STATUS.md, step numbering, and dependencies.',
        {
            path: z.string().optional(),
            fix: z.boolean().optional(),
        }
    );

    registerTool(
        'riotplan_generate',
        'Generate plan content from an existing prompt file. Useful for regenerating plan files.',
        {
            path: z.string().optional(),
            steps: z.number().optional(),
            provider: z.string().optional(),
            model: z.string().optional(),
        }
    );

    // ========================================================================
    // Resources Handlers
    // ========================================================================

    const resources = getResources();
    for (const resource of resources) {
        server.resource(
            resource.name,
            resource.uri,
            {
                description: resource.description || '',
            },
            async () => {
                const data = await readResource(resource.uri);
                return {
                    contents: [{
                        uri: resource.uri,
                        mimeType: resource.mimeType || 'application/json',
                        text: JSON.stringify(data, null, 2),
                    }],
                };
            }
        );
    }

    // ========================================================================
    // Prompts Handlers
    // ========================================================================

    const prompts = getPrompts();
    for (const prompt of prompts) {
        const promptArgs: Record<string, z.ZodTypeAny> = {};
        if (prompt.arguments) {
            for (const arg of prompt.arguments) {
                promptArgs[arg.name] = arg.required ? z.string() : z.string().optional();
            }
        }
        server.prompt(
            prompt.name,
            prompt.description,
            promptArgs,
            async (args, _extra) => {
                const argsRecord: Record<string, string> = {};
                for (const [key, value] of Object.entries(args)) {
                    if (typeof value === 'string') {
                        argsRecord[key] = value;
                    }
                }
                const messages = await getPrompt(prompt.name, argsRecord);
                return {
                    messages: messages.map(msg => {
                        if (msg.content.type === 'text') {
                            return {
                                role: msg.role,
                                content: {
                                    type: 'text' as const,
                                    text: msg.content.text || '',
                                },
                            };
                        }
                        return msg as any;
                    }),
                };
            }
        );
    }

    // ========================================================================
    // Start Server
    // ========================================================================

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

// Handle errors silently in MCP mode
main().catch((_error) => {
    process.exit(1);
});
