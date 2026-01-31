/**
 * Execution Module
 *
 * Provides integration with LLM execution providers for automated step execution.
 * This module wraps @kjerneverk/execution and provider-specific packages.
 */

import type { Plan, PlanStep, StepResult } from "../types.js";

/**
 * Available execution providers
 */
export type ExecutionProviderType = "anthropic" | "openai" | "gemini" | "mock";

/**
 * Configuration for an execution provider
 */
export interface ProviderConfig {
    /** Provider type */
    type: ExecutionProviderType;

    /** API key (if required) */
    apiKey?: string;

    /** Model to use */
    model?: string;

    /** Maximum tokens */
    maxTokens?: number;

    /** Temperature */
    temperature?: number;
}

/**
 * Execution context passed to step execution
 */
export interface ExecutionContext {
    /** The plan being executed */
    plan: Plan;

    /** Current step being executed */
    step: PlanStep;

    /** Provider configuration */
    provider: ProviderConfig;

    /** Environment variables */
    env?: Record<string, string>;

    /** Working directory */
    workingDirectory?: string;

    /** Callback for progress updates */
    onProgress?: (message: string) => void;

    /** Callback for step completion */
    onComplete?: (result: StepResult) => void;
}

/**
 * Step executor interface
 */
export interface StepExecutor {
    /** Execute a single step */
    execute(context: ExecutionContext): Promise<StepResult>;
}

/**
 * Mock step executor for testing
 */
export class MockStepExecutor implements StepExecutor {
    private delay: number;
    private shouldFail: boolean;

    constructor(options?: { delay?: number; shouldFail?: boolean }) {
        this.delay = options?.delay ?? 100;
        this.shouldFail = options?.shouldFail ?? false;
    }

    async execute(context: ExecutionContext): Promise<StepResult> {
        // Simulate execution time
        await new Promise((resolve) => setTimeout(resolve, this.delay));

        context.onProgress?.(`Executing step ${context.step.number}...`);

        if (this.shouldFail) {
            return {
                success: false,
                step: context.step.number,
                error: new Error("Mock execution failed"),
                duration: 0,
            };
        }

        return {
            success: true,
            step: context.step.number,
            output: `Completed step ${context.step.number}: ${context.step.title}`,
            duration: 0,
        };
    }
}

/**
 * Create a step executor for the given provider
 *
 * Note: This currently only supports mock execution.
 * Full provider integration requires importing @kjerneverk/execution-* packages.
 */
export function createExecutor(config: ProviderConfig): StepExecutor {
    switch (config.type) {
        case "mock":
            return new MockStepExecutor();

        case "anthropic":
        case "openai":
        case "gemini":
            // For real providers, users should import the specific execution package
            throw new Error(
                `Provider '${config.type}' requires @kjerneverk/execution-${config.type} package. ` +
                    `Import and configure it directly for LLM-powered execution.`
            );

        default:
            throw new Error(`Unknown provider: ${config.type}`);
    }
}

/**
 * Execute a step with the given executor
 */
export async function executeStep(
    executor: StepExecutor,
    plan: Plan,
    stepNumber: number,
    options?: {
        provider?: ProviderConfig;
        workingDirectory?: string;
        env?: Record<string, string>;
        onProgress?: (message: string) => void;
        onComplete?: (result: StepResult) => void;
    }
): Promise<StepResult> {
    const step = plan.steps?.find((s) => s.number === stepNumber);

    if (!step) {
        return {
            success: false,
            step: stepNumber,
            error: new Error(`Step ${stepNumber} not found`),
            duration: 0,
        };
    }

    const context: ExecutionContext = {
        plan,
        step,
        provider: options?.provider ?? { type: "mock" },
        workingDirectory: options?.workingDirectory,
        env: options?.env,
        onProgress: options?.onProgress,
        onComplete: options?.onComplete,
    };

    const result = await executor.execute(context);

    options?.onComplete?.(result);

    return result;
}

/**
 * Execute all pending steps in a plan
 */
export async function executePendingSteps(
    executor: StepExecutor,
    plan: Plan,
    options?: {
        provider?: ProviderConfig;
        stopOnError?: boolean;
        onProgress?: (step: number, message: string) => void;
        onStepComplete?: (step: number, result: StepResult) => void;
    }
): Promise<StepResult[]> {
    const results: StepResult[] = [];
    const pendingSteps =
        plan.steps?.filter((s) => s.status === "pending") ??
        [];

    for (const step of pendingSteps) {
        const result = await executeStep(executor, plan, step.number, {
            provider: options?.provider,
            onProgress: (msg) => options?.onProgress?.(step.number, msg),
            onComplete: (res) => options?.onStepComplete?.(step.number, res),
        });

        results.push(result);

        if (!result.success && options?.stopOnError) {
            break;
        }
    }

    return results;
}

/**
 * Provider-specific executor factory type
 *
 * External provider packages should export functions matching this signature.
 */
export type ExecutorFactory = (config: ProviderConfig) => StepExecutor;

