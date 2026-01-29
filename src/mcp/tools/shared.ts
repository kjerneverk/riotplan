/**
 * Shared utilities for MCP tools
 */

import type { ToolExecutionContext, ToolResult } from '../types.js';
import { resolve } from 'node:path';

/**
 * Helper to resolve directory path
 */
export function resolveDirectory(args: any, context: ToolExecutionContext): string {
    return args.directory ? resolve(args.directory) : context.workingDirectory;
}

/**
 * Helper to format errors for MCP
 */
export function formatError(error: any): ToolResult {
    const message = error instanceof Error ? error.message : String(error);
    
    return {
        success: false,
        error: message,
        context: {
            errorType: error?.constructor?.name || 'Error',
        },
    };
}

/**
 * Helper to create success result
 */
export function createSuccess(data: any, message?: string): ToolResult {
    return {
        success: true,
        data,
        message,
    };
}

/**
 * Helper to send progress notification
 */
export async function sendProgress(
    context: ToolExecutionContext,
    progress: number,
    total: number,
    message: string
): Promise<void> {
    if (context.sendNotification && context.progressToken) {
        await context.sendNotification({
            method: 'notifications/progress',
            params: {
                progressToken: context.progressToken,
                progress,
                total,
                message,
            },
        });
    }
}
