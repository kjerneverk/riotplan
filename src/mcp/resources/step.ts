/**
 * Step Resource Handler
 */

import type { StepResource } from '../types.js';
import { loadPlan } from '../../plan/loader.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function readStepResource(path: string, stepNumber: number): Promise<StepResource> {
    try {
        const plan = await loadPlan(path);
        
        const step = plan.steps.find(s => s.number === stepNumber);
        if (!step) {
            throw new Error(`Step ${stepNumber} not found in plan`);
        }

        // Read step file content
        const stepFilePath = join(plan.path, 'plan', step.file);
        const content = readFileSync(stepFilePath, 'utf-8');

        return {
            planPath: plan.path,
            number: step.number,
            title: step.title,
            status: step.status,
            file: step.file,
            content,
        };
    } catch (error) {
        throw new Error(`Failed to read step ${stepNumber} at ${path}: ${error}`);
    }
}
