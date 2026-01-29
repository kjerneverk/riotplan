/**
 * MCP Resource Handlers
 *
 * Provides read-only access to plan data via resources
 */

import type { McpResource } from '../types.js';
import { readPlanResource } from './plan.js';
import { readStatusResource } from './status.js';
import { readStepsResource } from './steps.js';
import { readStepResource } from './step.js';
import { parseUri } from '../uri.js';

/**
 * Get all available resources
 */
export function getResources(): McpResource[] {
    return [
        {
            uri: 'riotplan://plan/{path}',
            name: 'Plan',
            description: 'Read plan metadata and structure',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://status/{path}',
            name: 'Status',
            description: 'Read plan status and progress',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://steps/{path}',
            name: 'Steps',
            description: 'List all steps in a plan',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://step/{path}/{number}',
            name: 'Step',
            description: 'Read a specific step with full content',
            mimeType: 'application/json',
        },
    ];
}

/**
 * Read a resource by URI
 */
export async function readResource(uri: string): Promise<any> {
    const parsed = parseUri(uri);

    switch (parsed.type) {
        case 'plan':
            return await readPlanResource(parsed.path || '.');
        case 'status':
            return await readStatusResource(parsed.path || '.');
        case 'steps':
            return await readStepsResource(parsed.path || '.');
        case 'step': {
            const stepNumber = parsed.query?.number ? parseInt(parsed.query.number) : undefined;
            if (!stepNumber) {
                throw new Error('Step number is required for step resource');
            }
            return await readStepResource(parsed.path || '.', stepNumber);
        }
        default:
            throw new Error(`Unknown resource type: ${parsed.type}`);
    }
}
