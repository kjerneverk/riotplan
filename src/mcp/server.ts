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
import { resolvePlanDirectory } from '../config/index.js';

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

    // Suppress stdout to prevent pollution of MCP JSON-RPC stream
    // MCP uses stdio for communication, so any stdout output will corrupt the protocol
    // Redirect stdout to stderr so logs don't break MCP
    process.stdout.write = (chunk: any, encoding?: any, callback?: any): boolean => {
        // Redirect to stderr instead
        return process.stderr.write(chunk, encoding, callback);
    };

    // Set up error logging for MCP server
    const logError = (context: string, error: unknown) => {
        const timestamp = new Date().toISOString();
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        // Log to stderr for MCP debugging
        // eslint-disable-next-line no-console
        console.error(`[${timestamp}] RiotPlan MCP Error (${context}):`, errorMessage);
        if (errorStack) {
            // eslint-disable-next-line no-console
            console.error('Stack:', errorStack);
        }
    };

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
                try {
                    // Resolve plan directory using four-tier strategy
                    const planDirectory = await resolvePlanDirectory();
                    
                    const context = {
                        workingDirectory: planDirectory,
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
                        const textContent = cleanData !== undefined 
                            ? JSON.stringify(cleanData, null, 2)
                            : result.message || 'Success';
                        
                        content.push({
                            type: 'text' as const,
                            text: textContent,
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
                } catch (error) {
                    // Catch any unhandled errors in tool execution
                    logError(`tool:${name}`, error);
                    
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorStack = error instanceof Error ? error.stack : undefined;
                    
                    return {
                        content: [{
                            type: 'text' as const,
                            text: `=== Unhandled Error in ${name} ===\n\n${errorMessage}\n\n${errorStack ? `Stack:\n${errorStack}` : ''}`,
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

    // Idea stage tools
    registerTool(
        'riotplan_idea_create',
        'Create a new idea without commitment. Start exploring a concept in the Idea stage.',
        {
            code: z.string(),
            description: z.string(),
            directory: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_idea_add_note',
        'Add a note to an idea. Capture thoughts and observations during exploration.',
        {
            note: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_idea_add_constraint',
        'Add a constraint to an idea. Document limitations and requirements.',
        {
            constraint: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_idea_add_question',
        'Add a question to an idea. Raise uncertainties that need resolution.',
        {
            question: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_idea_add_evidence',
        'Add evidence to an idea. Attach supporting materials like diagrams, documents, or examples.',
        {
            evidencePath: z.string(),
            description: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_idea_add_narrative',
        'Add raw narrative content to the timeline. Use this to capture conversational context, thinking-out-loud, or any free-form input that doesn\'t fit structured categories. Narrative chunks preserve full-fidelity context.',
        {
            content: z.string(),
            path: z.string().optional(),
            source: z.enum(["typing", "voice", "paste", "import"]).optional(),
            context: z.string().optional(),
            speaker: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_idea_kill',
        'Kill an idea. Abandon the idea with a reason, preserving the learning.',
        {
            reason: z.string(),
            path: z.string().optional(),
        }
    );

    // Shaping stage tools
    registerTool(
        'riotplan_shaping_start',
        'Start shaping an idea. Move from Idea to Shaping stage to explore approaches.',
        {
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_shaping_add_approach',
        'Add an approach to consider. Propose a way to solve the problem with explicit tradeoffs.',
        {
            name: z.string(),
            description: z.string(),
            tradeoffs: z.array(z.string()),
            assumptions: z.array(z.string()).optional(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_shaping_add_feedback',
        'Add feedback on an approach. Provide observations, concerns, or suggestions.',
        {
            approach: z.string(),
            feedback: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_shaping_add_evidence',
        'Add evidence for an approach. Attach supporting materials that inform the decision.',
        {
            approach: z.string(),
            evidencePath: z.string(),
            description: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_shaping_compare',
        'Compare all approaches. Generate a side-by-side comparison of tradeoffs.',
        {
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_shaping_select',
        'Select an approach. Choose the best approach and move to Built stage.',
        {
            approach: z.string(),
            reason: z.string(),
            path: z.string().optional(),
        }
    );

    // History and checkpoint tools
    registerTool(
        'riotplan_checkpoint_create',
        'Create a checkpoint. Save a snapshot of the current state with prompt context.',
        {
            name: z.string(),
            message: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_checkpoint_list',
        'List all checkpoints. Show all saved checkpoints with timestamps.',
        {
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_checkpoint_show',
        'Show checkpoint details. Display the full checkpoint snapshot and prompt context.',
        {
            checkpoint: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_checkpoint_restore',
        'Restore a checkpoint. Revert to a previous state.',
        {
            checkpoint: z.string(),
            path: z.string().optional(),
        }
    );

    registerTool(
        'riotplan_history_show',
        'Show ideation history. Display the complete timeline of events.',
        {
            path: z.string().optional(),
            limit: z.number().optional(),
            sinceCheckpoint: z.string().optional(),
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

// Set up global error handlers for better resilience
process.on('uncaughtException', (error) => {
    // eslint-disable-next-line no-console
    console.error('[RiotPlan MCP] Uncaught Exception:', error.message);
    // eslint-disable-next-line no-console
    console.error('Stack:', error.stack);
    // Don't exit - try to keep server running
});

process.on('unhandledRejection', (reason, promise) => {
    // eslint-disable-next-line no-console
    console.error('[RiotPlan MCP] Unhandled Rejection at:', promise);
    // eslint-disable-next-line no-console
    console.error('Reason:', reason);
    // Don't exit - try to keep server running
});

// Handle errors with better logging
main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[RiotPlan MCP] Fatal error during startup:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
        // eslint-disable-next-line no-console
        console.error('Stack:', error.stack);
    }
    process.exit(1);
});
