/**
 * Shared utilities for MCP tools
 */

import { resolve } from 'node:path';
import type { ToolResult, ToolExecutionContext } from '../types.js';

export function formatTimestamp(): string {
    return new Date().toISOString();
}

export function formatDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Resolve directory from args or context
 */
export function resolveDirectory(args: any, context: ToolExecutionContext): string {
    if (args.path) {
        return resolve(args.path);
    }
    if (context.workingDirectory) {
        return context.workingDirectory;
    }
    return process.cwd();
}

/**
 * Format error as ToolResult
 */
export function formatError(error: unknown): ToolResult {
    const message = error instanceof Error ? error.message : String(error);
    return {
        success: false,
        error: message,
    };
}

/**
 * Create success ToolResult
 */
export function createSuccess(data: any, message?: string): ToolResult {
    return {
        success: true,
        data,
        message,
    };
}
