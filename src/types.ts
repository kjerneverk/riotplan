/**
 * RiotPlan Type Definitions
 *
 * Types for long-lived, stateful AI workflows (plans).
 *
 * A plan consists of:
 * - A directory (the plan code/name)
 * - A meta-prompt (prompt-of-prompts)
 * - Numbered step files (01-STEP.md, 02-STEP.md, etc.)
 * - Status tracking (STATUS.md)
 * - Execution strategy (EXECUTION_PLAN.md)
 * - Summary (SUMMARY.md)
 * - Optional analysis directory
 */

// ===== TASK STATUS =====

/**
 * Status of a task, phase, or step
 */
export type TaskStatus =
  | "pending" // Not started (⬜)
  | "in_progress" // Currently active (🔄)
  | "completed" // Done (✅)
  | "failed" // Failed with error (❌)
  | "blocked" // Waiting on dependency (⏸️)
  | "skipped"; // Intentionally skipped (⏭️)

/**
 * Priority level
 */
export type Priority = "high" | "medium" | "low";

// ===== PLAN STRUCTURE =====

/**
 * A single step in a plan (corresponds to a numbered file like 01-STEP.md)
 */
export interface PlanStep {
  /** Step number (1, 2, 3...) */
  number: number;

  /** Step code/slug (extracted from filename, e.g., "execution-interfaces") */
  code: string;

  /** Full filename (e.g., "01-execution-interfaces.md") */
  filename: string;

  /** Human-readable title */
  title: string;

  /** Step description */
  description?: string;

  /** Current status */
  status: TaskStatus;

  /** Dependencies on other steps (by number) */
  dependencies?: number[];

  /** When this step was started */
  startedAt?: Date;

  /** When this step was completed */
  completedAt?: Date;

  /** Duration in milliseconds */
  duration?: number;

  /** Notes or issues encountered */
  notes?: string;

  /** Path to the step file */
  filePath: string;
}

/**
 * A phase grouping multiple steps
 */
export interface PlanPhase {
  /** Phase number */
  number: number;

  /** Phase name */
  name: string;

  /** Description */
  description?: string;

  /** Steps in this phase */
  steps: number[]; // Step numbers

  /** Phase status (derived from step statuses) */
  status: TaskStatus;

  /** Estimated duration */
  estimatedDuration?: string;

  /** Actual duration */
  actualDuration?: string;
}

/**
 * Blocker preventing progress
 */
export interface Blocker {
  /** Unique identifier */
  id: string;

  /** Description of the blocker */
  description: string;

  /** Severity */
  severity: Priority;

  /** Affected steps */
  affectedSteps: number[];

  /** When created */
  createdAt: Date;

  /** When resolved */
  resolvedAt?: Date;

  /** Resolution notes */
  resolution?: string;
}

/**
 * Issue encountered during execution
 */
export interface Issue {
  /** Unique identifier */
  id: string;

  /** Issue title */
  title: string;

  /** Description */
  description: string;

  /** Severity */
  severity: Priority;

  /** Related step */
  step?: number;

  /** When encountered */
  createdAt: Date;

  /** When resolved */
  resolvedAt?: Date;

  /** How it was resolved */
  resolution?: string;
}

// ===== PLAN METADATA =====

/**
 * Plan metadata from the directory and files
 */
export interface PlanMetadata {
  /** Plan code (directory name, e.g., "big-splitup") */
  code: string;

  /** Human-readable name */
  name: string;

  /** Description from SUMMARY.md or meta-prompt */
  description?: string;

  /** Version (for tracking changes to the plan itself) */
  version?: string;

  /** Author */
  author?: string;

  /** Tags for categorization */
  tags?: string[];

  /** When the plan was created */
  createdAt?: Date;

  /** Path to the plan directory */
  path: string;
}

// ===== PLAN FILES =====

/**
 * Standard plan files
 */
export interface PlanFiles {
  /** Meta-prompt file (e.g., "big-splitup-prompt.md" or "prompt-of-prompts.md") */
  metaPrompt?: string;

  /** Summary file */
  summary?: string;

  /** Status file */
  status?: string;

  /** Execution plan file */
  executionPlan?: string;

  /** README file */
  readme?: string;

  /** Step files in order */
  steps: string[];

  /** Analysis directory */
  analysisDir?: string;

  /** Other directories (architecture/, implementation/, testing/) */
  subdirectories: string[];
}

// ===== PLAN STATE =====

/**
 * Current state of plan execution
 */
export interface PlanState {
  /** Overall plan status */
  status: TaskStatus;

  /** Current step being executed */
  currentStep?: number;

  /** Last completed step */
  lastCompletedStep?: number;

  /** When execution started */
  startedAt?: Date;

  /** When last updated */
  lastUpdatedAt: Date;

  /** When completed */
  completedAt?: Date;

  /** Active blockers */
  blockers: Blocker[];

  /** Issues encountered */
  issues: Issue[];

  /** Progress percentage (0-100) */
  progress: number;
}

// ===== COMPLETE PLAN =====

/**
 * Complete plan definition
 */
export interface Plan {
  /** Plan metadata */
  metadata: PlanMetadata;

  /** Plan files */
  files: PlanFiles;

  /** Plan steps */
  steps: PlanStep[];

  /** Plan phases (optional grouping) */
  phases?: PlanPhase[];

  /** Current state */
  state: PlanState;
}

// ===== EXECUTION =====

/**
 * Context for plan execution
 */
export interface PlanContext {
  /** Working directory */
  workingDirectory: string;

  /** The plan being executed */
  plan: Plan;

  /** Logger instance */
  logger?: any;

  /** Storage for artifacts */
  storage?: any;

  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Result of executing a step
 */
export interface StepResult {
  /** Whether the step succeeded */
  success: boolean;

  /** Step number */
  step: number;

  /** Output from execution */
  output?: string;

  /** Error if failed */
  error?: Error;

  /** Duration in milliseconds */
  duration: number;

  /** Artifacts produced */
  artifacts?: string[];
}

/**
 * Result of executing a plan
 */
export interface PlanResult {
  /** Whether the plan completed successfully */
  success: boolean;

  /** Steps that were executed */
  executedSteps: number[];

  /** Steps that succeeded */
  completedSteps: number[];

  /** Steps that failed */
  failedSteps: number[];

  /** Steps that were skipped */
  skippedSteps: number[];

  /** Total duration */
  duration: number;

  /** Final plan state */
  finalState: PlanState;
}

// ===== SERIALIZATION =====

/**
 * STATUS.md schema for parsing/generating
 */
export interface StatusDocument {
  /** Document title */
  title: string;

  /** Current state summary */
  currentState: {
    status: TaskStatus;
    currentStep?: string;
    lastCompleted?: string;
    startedAt?: string;
    lastUpdated?: string;
  };

  /** Step progress table */
  stepProgress: Array<{
    step: string;
    name: string;
    status: TaskStatus;
    started?: string;
    completed?: string;
    notes?: string;
  }>;

  /** Blockers section */
  blockers: string[];

  /** Issues section */
  issues: string[];

  /** Notes section */
  notes?: string;
}

/**
 * EXECUTION_PLAN.md schema
 */
export interface ExecutionPlanDocument {
  /** Strategy description */
  strategy: string;

  /** Prerequisites */
  prerequisites: string[];

  /** Phases with their steps */
  phases: Array<{
    name: string;
    description: string;
    steps: string[];
  }>;

  /** Quality gates */
  qualityGates?: string[];

  /** Rollback instructions */
  rollback?: string;
}

// ===== PLAN CONVENTIONS =====

/**
 * File naming conventions
 */
export const PLAN_CONVENTIONS = {
    /** Meta-prompt file patterns */
    metaPromptPatterns: [
        "{code}-prompt.md",
        "prompt-of-prompts.md",
        "{code}.md",
    ],

    /** Step file pattern */
    stepPattern: /^(\d{2})-(.+)\.md$/,

    /** Standard files */
    standardFiles: {
        summary: "SUMMARY.md",
        status: "STATUS.md",
        executionPlan: "EXECUTION_PLAN.md",
        readme: "README.md",
    },

    /** Standard directories */
    standardDirs: {
        plan: "plan",
        analysis: "analysis",
        architecture: "architecture",
        implementation: "implementation",
        testing: "testing",
    },

    /** Status emoji mapping */
    statusEmoji: {
        pending: "⬜",
        in_progress: "🔄",
        completed: "✅",
        failed: "❌",
        blocked: "⏸️",
        skipped: "⏭️",
    } as Record<TaskStatus, string>,
} as const;

