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
import { readIdeaResource } from './idea.js';
import { readTimelineResource } from './timeline.js';
import { readPromptsListResource, readPromptResource } from './prompts.js';
import { readEvidenceListResource, readEvidenceResource } from './evidence.js';
import { readShapingResource } from './shaping.js';
import { readCheckpointsListResource, readCheckpointResource } from './checkpoints.js';
import { parseUri } from '../uri.js';

/**
 * Get all available resources
 */
export function getResources(): McpResource[] {
    return [
        // Plan execution resources
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
        
        // Ideation context resources
        {
            uri: 'riotplan://idea/{path}',
            name: 'Idea',
            description: 'Read IDEA.md file with core concept, constraints, questions, and evidence',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://timeline/{path}',
            name: 'Timeline',
            description: 'Read .history/timeline.jsonl with full evolution of thinking (notes, narratives, decisions)',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://prompts/{path}',
            name: 'Prompts List',
            description: 'List all prompt files in .history/prompts/ directory',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://prompt/{path}/{file}',
            name: 'Prompt',
            description: 'Read a specific prompt file with conversational context',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://evidence/{path}',
            name: 'Evidence List',
            description: 'List all evidence files in evidence/ directory',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://evidence-file/{path}/{file}',
            name: 'Evidence File',
            description: 'Read a specific evidence file',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://shaping/{path}',
            name: 'Shaping',
            description: 'Read SHAPING.md with approaches, tradeoffs, and selected approach',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://checkpoints/{path}',
            name: 'Checkpoints List',
            description: 'List all checkpoints in .history/checkpoints/ directory',
            mimeType: 'application/json',
        },
        {
            uri: 'riotplan://checkpoint/{path}/{name}',
            name: 'Checkpoint',
            description: 'Read a specific checkpoint with snapshot and prompt context',
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
        // Plan execution resources
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
        
        // Ideation context resources
        case 'idea':
            return await readIdeaResource(parsed.path || '.');
        case 'timeline':
            return await readTimelineResource(parsed.path || '.');
        case 'prompts':
            return await readPromptsListResource(parsed.path || '.');
        case 'prompt': {
            const file = parsed.query?.file;
            if (!file) {
                throw new Error('File name is required for prompt resource');
            }
            return await readPromptResource(parsed.path || '.', file);
        }
        case 'evidence':
            return await readEvidenceListResource(parsed.path || '.');
        case 'evidence-file': {
            const file = parsed.query?.file;
            if (!file) {
                throw new Error('File name is required for evidence resource');
            }
            return await readEvidenceResource(parsed.path || '.', file);
        }
        case 'shaping':
            return await readShapingResource(parsed.path || '.');
        case 'checkpoints':
            return await readCheckpointsListResource(parsed.path || '.');
        case 'checkpoint': {
            const name = parsed.query?.name;
            if (!name) {
                throw new Error('Checkpoint name is required for checkpoint resource');
            }
            return await readCheckpointResource(parsed.path || '.', name);
        }
        
        default:
            throw new Error(`Unknown resource type: ${parsed.type}`);
    }
}
