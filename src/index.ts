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
    // Feedback types
    FeedbackPlatform,
    FeedbackParticipant,
    FeedbackContext,
    FeedbackRecord,
    // Evidence types
    EvidenceType,
    EvidenceRecord,
    // Revision/History types
    PlanRevision,
    PlanMilestone,
    PlanHistory,
    // Context types
    ContextId,
    PlanContextDefinition,
    // Cross-plan relationship types
    RelationshipType,
    PlanRelationship,
    // Plan structure types
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

// Plan Operations
export { loadPlan, type LoadPlanOptions } from "./plan/loader.js";
export {
    createPlan,
    type CreatePlanConfig,
    type CreatePlanResult,
} from "./plan/creator.js";

export {
    validatePlan,
    type ValidationResult,
    type ValidationError,
    type ValidationWarning,
    type ValidationInfo,
    type FixableIssue,
    type ValidateOptions,
} from "./plan/validator.js";

// Feedback Operations
export {
    createFeedback,
    listFeedback,
    getFeedback,
    type CreateFeedbackOptions,
    type CreateFeedbackResult,
} from "./feedback/index.js";

// Status Operations
export {
    parseStatus,
    type ParseStatusOptions,
    type ParseStatusResult,
} from "./status/parser.js";

export {
    generateStatus,
    updateStatus,
    type GenerateStatusOptions,
    type UpdateStatusOptions,
} from "./status/generator.js";

// Step Operations
export {
    insertStep,
    removeStep,
    moveStep,
    blockStep,
    unblockStep,
    completeStep,
    startStep,
    skipStep,
    failStep,
    type InsertStepOptions,
    type InsertStepResult,
    type RemoveStepResult,
    type MoveStepResult,
} from "./steps/operations.js";

// Dependency Operations
export {
    // Parsing
    parseDependenciesFromContent,
    parseDependenciesFromFile,
    parseAllDependencies,
    // Graph Building
    buildDependencyGraph,
    buildDependencyGraphFromMap,
    // Validation
    validateDependencies,
    // Critical Path
    findCriticalPath,
    // Execution Order
    computeExecutionOrder,
    // Helpers
    getReadySteps,
    getBlockedSteps,
    getDependencyChain,
    updateStepDependencies,
    // Types
    type StepDependency,
    type DependencyGraph,
    type DependencyValidation,
    type DependencyError,
    type DependencyWarning,
    type CriticalPath,
    type ExecutionOrder,
} from "./dependencies/index.js";

// Relationship Operations (Cross-Plan Dependencies)
export {
    // Parsing
    parseRelationshipsFromContent,
    parseRelationshipsFromPlan,
    // Management
    addRelationship,
    removeRelationship,
    createBidirectionalRelationship,
    // Validation
    validateRelationships,
    // Queries
    getRelationshipsByType,
    getInverseRelationType,
    getBlockingPlans,
    getBlockedPlans,
    getParentPlan,
    getChildPlans,
    getRelatedPlans,
    // Serialization
    generateRelationshipsMarkdown,
    updatePlanRelationships,
    // Types
    type AddRelationshipOptions,
    type AddRelationshipResult,
    type RelationshipValidation,
    type InvalidRelationship,
    type ParsedRelationship,
} from "./relationships/index.js";

// Plan Registry Operations
export {
    // Registry Management
    createRegistry,
    loadRegistry,
    saveRegistry,
    getDefaultRegistryPath,
    // Plan Discovery
    scanForPlans,
    // Plan Registration
    registerPlan,
    unregisterPlan,
    refreshPlan,
    refreshAllPlans,
    // Search and Query
    searchPlans,
    getPlanByCode,
    getPlanByPath,
    getPlansByStatus,
    // Statistics
    getRegistryStats,
    // Types
    type RegisteredPlan,
    type PlanRegistry,
    type RegistryOptions,
    type SearchResult,
    type SearchOptions,
    type RegistryStats,
} from "./registry/index.js";

// Retrospective Operations
export {
    generateRetrospective,
    generateRetrospectiveMarkdown,
    createRetrospective,
    type Retrospective,
    type GenerateRetrospectiveOptions,
} from "./retrospective/index.js";

// Execution Operations
export {
    createExecutor,
    executeStep as executeStepWithExecutor,
    executePendingSteps,
    MockStepExecutor,
    type ExecutionProviderType,
    type ProviderConfig,
    type ExecutionContext,
    type StepExecutor,
    type ExecutorFactory,
} from "./execution/index.js";

// Version
export const VERSION = "0.0.1";

// ===== STUB IMPLEMENTATIONS =====
// These will be implemented as the project develops

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

