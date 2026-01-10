/**
 * RiotPlan - Framework for long-lived, stateful AI workflows
 *
 * A plan is a structured way to manage multi-step AI-assisted tasks that:
 * - Span multiple sessions/days
 * - Have persistent state (STATUS.md)
 * - Are organized into numbered steps
 * - Can be interrupted and resumed
 * - Track progress with checkboxes and statuses
 *
 * @example Plan directory structure:
 * ```
 * my-plan/
 * ├── my-plan-prompt.md     # Meta-prompt (prompt-of-prompts)
 * ├── SUMMARY.md            # Overview of the approach
 * ├── EXECUTION_PLAN.md     # Step-by-step strategy
 * ├── STATUS.md             # Current state (auto-updated)
 * ├── plan/                 # Step files (optional subdirectory)
 * │   ├── 01-first-step.md
 * │   ├── 02-second-step.md
 * │   └── ...
 * └── analysis/             # Analysis output (optional)
 * ```
 */

// ===== EXPORTS =====

// Types
export type {
    TaskStatus,
    Priority,
    PlanStep,
    PlanPhase,
    Blocker,
    Issue,
    PlanMetadata,
    PlanFiles,
    PlanState,
    Plan,
    PlanContext,
    StepResult,
    PlanResult,
    StatusDocument,
    ExecutionPlanDocument,
} from "./types.js";

// Constants
export { PLAN_CONVENTIONS } from "./types.js";

// Version
export const VERSION = "0.0.1";

// ===== STUB IMPLEMENTATIONS =====
// These will be implemented as the project develops

/**
 * Load a plan from a directory
 *
 * @param path - Path to the plan directory
 * @returns The loaded plan
 *
 * @example
 * ```typescript
 * const plan = await loadPlan('./prompts/big-splitup');
 * console.log(plan.metadata.code); // 'big-splitup'
 * console.log(plan.steps.length);  // 11
 * ```
 *
 * @stub Not yet implemented
 */
export async function loadPlan(_path: string): Promise<never> {
    throw new Error(
        "riotplan.loadPlan is not yet implemented. Coming in v0.1.0!"
    );
}

/**
 * Create a new plan
 *
 * @param config - Plan configuration
 * @returns The created plan
 *
 * @example
 * ```typescript
 * const plan = await createPlan({
 *   code: 'my-feature',
 *   name: 'My Feature Implementation',
 *   path: './prompts/my-feature',
 *   steps: [
 *     { title: 'Setup', description: 'Initial setup' },
 *     { title: 'Implementation', description: 'Core work' },
 *     { title: 'Testing', description: 'Verify it works' },
 *   ]
 * });
 * ```
 *
 * @stub Not yet implemented
 */
export async function createPlan(_config: {
  code: string;
  name: string;
  path: string;
  description?: string;
  steps?: Array<{ title: string; description?: string }>;
}): Promise<never> {
    throw new Error(
        "riotplan.createPlan is not yet implemented. Coming in v0.1.0!"
    );
}

/**
 * Parse a STATUS.md file
 *
 * @param content - The STATUS.md content
 * @returns Parsed status document
 *
 * @stub Not yet implemented
 */
export function parseStatus(_content: string): never {
    throw new Error(
        "riotplan.parseStatus is not yet implemented. Coming in v0.1.0!"
    );
}

/**
 * Generate a STATUS.md file
 *
 * @param plan - The plan to generate status for
 * @returns STATUS.md content
 *
 * @stub Not yet implemented
 */
export function generateStatus(_plan: unknown): never {
    throw new Error(
        "riotplan.generateStatus is not yet implemented. Coming in v0.1.0!"
    );
}

/**
 * Execute a plan step
 *
 * @param plan - The plan
 * @param stepNumber - Step to execute
 * @param context - Execution context
 * @returns Step result
 *
 * @stub Not yet implemented
 */
export async function executeStep(
    _plan: unknown,
    _stepNumber: number,
    _context?: unknown
): Promise<never> {
    throw new Error(
        "riotplan.executeStep is not yet implemented. Coming in v0.1.0!"
    );
}

/**
 * Resume a plan from its current state
 *
 * @param plan - The plan to resume
 * @param context - Execution context
 * @returns Plan result
 *
 * @stub Not yet implemented
 */
export async function resumePlan(
    _plan: unknown,
    _context?: unknown
): Promise<never> {
    throw new Error(
        "riotplan.resumePlan is not yet implemented. Coming in v0.1.0!"
    );
}

/**
 * Update plan state after step completion
 *
 * @param plan - The plan
 * @param stepNumber - Completed step
 * @param result - Step result
 * @returns Updated plan
 *
 * @stub Not yet implemented
 */
export function updatePlanState(
    _plan: unknown,
    _stepNumber: number,
    _result: unknown
): never {
    throw new Error(
        "riotplan.updatePlanState is not yet implemented. Coming in v0.1.0!"
    );
}

