/**
 * MCP Tool Definitions and Executors
 *
 * Provides MCP tool interfaces for riotplan commands
 */

import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';

// Import all tools
import { createTool, executeCreate } from './create.js';
import { statusTool, executeStatus } from './status.js';
import {
    stepListTool,
    stepStartTool,
    stepCompleteTool,
    stepAddTool,
    executeStepList,
    executeStepStart,
    executeStepComplete,
    executeStepAdd,
} from './step.js';
import { validateTool, executeValidate } from './validate.js';
import { generateTool, executeGenerate } from './generate.js';

/**
 * Base tool executor - wraps command logic
 */
export async function executeTool(
    toolName: string,
    args: Record<string, any>,
    context: ToolExecutionContext
): Promise<ToolResult> {
    try {
        // Route to specific tool handler
        switch (toolName) {
            case 'riotplan_create':
                return await executeCreate(args, context);
            case 'riotplan_status':
                return await executeStatus(args, context);
            case 'riotplan_step_list':
                return await executeStepList(args, context);
            case 'riotplan_step_start':
                return await executeStepStart(args, context);
            case 'riotplan_step_complete':
                return await executeStepComplete(args, context);
            case 'riotplan_step_add':
                return await executeStepAdd(args, context);
            case 'riotplan_validate':
                return await executeValidate(args, context);
            case 'riotplan_generate':
                return await executeGenerate(args, context);
            default:
                return {
                    success: false,
                    error: `Unknown tool: ${toolName}`,
                };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            context: {
                errorType: error?.constructor?.name || 'Error',
            },
        };
    }
}

/**
 * Tool definitions array
 */
export const tools: McpTool[] = [
    createTool,
    statusTool,
    stepListTool,
    stepStartTool,
    stepCompleteTool,
    stepAddTool,
    validateTool,
    generateTool,
];
