/**
 * Tests for RiotPlan types
 */

import { describe, it, expect } from 'vitest';
import type {
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
} from './types.js';
import { PLAN_CONVENTIONS } from './types.js';

describe('TaskStatus type', () => {
  it('should accept valid status values', () => {
    const statuses: TaskStatus[] = [
      'pending',
      'in_progress',
      'completed',
      'failed',
      'blocked',
      'skipped',
    ];
    expect(statuses).toHaveLength(6);
  });
});

describe('Priority type', () => {
  it('should accept valid priority values', () => {
    const priorities: Priority[] = ['high', 'medium', 'low'];
    expect(priorities).toHaveLength(3);
  });
});

describe('PlanStep interface', () => {
  it('should create a valid plan step', () => {
    const step: PlanStep = {
      number: 1,
      code: 'execution-interfaces',
      filename: '01-execution-interfaces.md',
      title: 'Execution Interfaces',
      description: 'Define provider interfaces',
      status: 'pending',
      dependencies: [],
      filePath: '/path/to/plan/01-execution-interfaces.md',
    };
    expect(step.number).toBe(1);
    expect(step.code).toBe('execution-interfaces');
    expect(step.status).toBe('pending');
  });

  it('should support optional fields', () => {
    const step: PlanStep = {
      number: 2,
      code: 'implementation',
      filename: '02-implementation.md',
      title: 'Implementation',
      status: 'completed',
      filePath: '/path/to/plan/02-implementation.md',
      startedAt: new Date('2026-01-10'),
      completedAt: new Date('2026-01-10'),
      duration: 3600000,
      notes: 'Completed successfully',
    };
    expect(step.startedAt).toBeInstanceOf(Date);
    expect(step.completedAt).toBeInstanceOf(Date);
    expect(step.duration).toBe(3600000);
    expect(step.notes).toBe('Completed successfully');
  });
});

describe('PlanPhase interface', () => {
  it('should create a valid plan phase', () => {
    const phase: PlanPhase = {
      number: 1,
      name: 'Infrastructure',
      description: 'Setup project structure',
      steps: [1, 2, 3],
      status: 'in_progress',
      estimatedDuration: '2 days',
    };
    expect(phase.number).toBe(1);
    expect(phase.steps).toEqual([1, 2, 3]);
    expect(phase.status).toBe('in_progress');
  });
});

describe('Blocker interface', () => {
  it('should create a valid blocker', () => {
    const blocker: Blocker = {
      id: 'blocker-1',
      description: 'Waiting for API access',
      severity: 'high',
      affectedSteps: [3, 4, 5],
      createdAt: new Date('2026-01-10'),
    };
    expect(blocker.id).toBe('blocker-1');
    expect(blocker.severity).toBe('high');
    expect(blocker.affectedSteps).toHaveLength(3);
  });

  it('should support resolution fields', () => {
    const blocker: Blocker = {
      id: 'blocker-2',
      description: 'Missing dependency',
      severity: 'medium',
      affectedSteps: [2],
      createdAt: new Date('2026-01-09'),
      resolvedAt: new Date('2026-01-10'),
      resolution: 'Installed missing package',
    };
    expect(blocker.resolvedAt).toBeInstanceOf(Date);
    expect(blocker.resolution).toBe('Installed missing package');
  });
});

describe('Issue interface', () => {
  it('should create a valid issue', () => {
    const issue: Issue = {
      id: 'issue-1',
      title: 'Build failure',
      description: 'TypeScript compilation error',
      severity: 'high',
      step: 3,
      createdAt: new Date('2026-01-10'),
    };
    expect(issue.id).toBe('issue-1');
    expect(issue.title).toBe('Build failure');
    expect(issue.step).toBe(3);
  });
});

describe('PlanMetadata interface', () => {
  it('should create valid plan metadata', () => {
    const metadata: PlanMetadata = {
      code: 'big-splitup',
      name: 'RiotPrompt Split-Up',
      description: 'Split monolith into modular packages',
      version: '1.0.0',
      author: 'developer',
      tags: ['refactoring', 'modular'],
      createdAt: new Date('2026-01-10'),
      path: '/path/to/plan',
    };
    expect(metadata.code).toBe('big-splitup');
    expect(metadata.name).toBe('RiotPrompt Split-Up');
    expect(metadata.tags).toContain('refactoring');
  });
});

describe('PlanFiles interface', () => {
  it('should create valid plan files structure', () => {
    const files: PlanFiles = {
      metaPrompt: 'big-splitup-prompt.md',
      summary: 'SUMMARY.md',
      status: 'STATUS.md',
      executionPlan: 'EXECUTION_PLAN.md',
      steps: [
        '01-execution-interfaces.md',
        '02-execution-providers.md',
        '03-agentic-extraction.md',
      ],
      subdirectories: ['plan', 'analysis'],
    };
    expect(files.steps).toHaveLength(3);
    expect(files.subdirectories).toContain('plan');
  });
});

describe('PlanState interface', () => {
  it('should create valid plan state', () => {
    const state: PlanState = {
      status: 'in_progress',
      currentStep: 3,
      lastCompletedStep: 2,
      startedAt: new Date('2026-01-10'),
      lastUpdatedAt: new Date('2026-01-10'),
      blockers: [],
      issues: [],
      progress: 27,
    };
    expect(state.status).toBe('in_progress');
    expect(state.currentStep).toBe(3);
    expect(state.progress).toBe(27);
  });
});

describe('Plan interface', () => {
  it('should create a complete plan', () => {
    const plan: Plan = {
      metadata: {
        code: 'test-plan',
        name: 'Test Plan',
        path: '/path/to/plan',
      },
      files: {
        steps: ['01-step.md'],
        subdirectories: [],
      },
      steps: [
        {
          number: 1,
          code: 'step',
          filename: '01-step.md',
          title: 'First Step',
          status: 'pending',
          filePath: '/path/to/plan/01-step.md',
        },
      ],
      state: {
        status: 'pending',
        lastUpdatedAt: new Date(),
        blockers: [],
        issues: [],
        progress: 0,
      },
    };
    expect(plan.metadata.code).toBe('test-plan');
    expect(plan.steps).toHaveLength(1);
    expect(plan.state.status).toBe('pending');
  });
});

describe('StepResult interface', () => {
  it('should create a successful step result', () => {
    const result: StepResult = {
      success: true,
      step: 1,
      output: 'Step completed successfully',
      duration: 5000,
      artifacts: ['dist/index.js', 'dist/types.d.ts'],
    };
    expect(result.success).toBe(true);
    expect(result.artifacts).toHaveLength(2);
  });

  it('should create a failed step result', () => {
    const result: StepResult = {
      success: false,
      step: 2,
      error: new Error('Build failed'),
      duration: 1000,
    };
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});

describe('PlanResult interface', () => {
  it('should create a plan result', () => {
    const result: PlanResult = {
      success: true,
      executedSteps: [1, 2, 3],
      completedSteps: [1, 2],
      failedSteps: [],
      skippedSteps: [3],
      duration: 60000,
      finalState: {
        status: 'completed',
        lastUpdatedAt: new Date(),
        blockers: [],
        issues: [],
        progress: 100,
      },
    };
    expect(result.success).toBe(true);
    expect(result.executedSteps).toHaveLength(3);
    expect(result.completedSteps).toHaveLength(2);
  });
});

describe('StatusDocument interface', () => {
  it('should create a status document', () => {
    const doc: StatusDocument = {
      title: 'Test Plan - Execution Status',
      currentState: {
        status: 'in_progress',
        currentStep: '02-implementation',
        lastCompleted: '01-setup',
        startedAt: '2026-01-10',
        lastUpdated: '2026-01-10',
      },
      stepProgress: [
        {
          step: '01',
          name: 'Setup',
          status: 'completed',
          started: '2026-01-10',
          completed: '2026-01-10',
        },
        {
          step: '02',
          name: 'Implementation',
          status: 'in_progress',
          started: '2026-01-10',
        },
      ],
      blockers: [],
      issues: [],
    };
    expect(doc.title).toBe('Test Plan - Execution Status');
    expect(doc.stepProgress).toHaveLength(2);
  });
});

describe('ExecutionPlanDocument interface', () => {
  it('should create an execution plan document', () => {
    const doc: ExecutionPlanDocument = {
      strategy: 'Incremental implementation with testing',
      prerequisites: ['Node.js 22+', 'npm 10+'],
      phases: [
        {
          name: 'Phase 1: Setup',
          description: 'Initialize project structure',
          steps: ['01-setup', '02-config'],
        },
        {
          name: 'Phase 2: Implementation',
          description: 'Build core functionality',
          steps: ['03-core', '04-api'],
        },
      ],
      qualityGates: ['All tests pass', 'No lint errors'],
      rollback: 'Revert to previous version',
    };
    expect(doc.phases).toHaveLength(2);
    expect(doc.prerequisites).toContain('Node.js 22+');
  });
});

describe('PLAN_CONVENTIONS', () => {
  it('should have meta-prompt patterns', () => {
    expect(PLAN_CONVENTIONS.metaPromptPatterns).toContain('{code}-prompt.md');
    expect(PLAN_CONVENTIONS.metaPromptPatterns).toContain('prompt-of-prompts.md');
  });

  it('should have step pattern regex', () => {
    const pattern = PLAN_CONVENTIONS.stepPattern;
    expect(pattern.test('01-setup.md')).toBe(true);
    expect(pattern.test('02-implementation.md')).toBe(true);
    expect(pattern.test('11-final.md')).toBe(true);
    expect(pattern.test('setup.md')).toBe(false);
    expect(pattern.test('1-setup.md')).toBe(false);
  });

  it('should have standard files', () => {
    expect(PLAN_CONVENTIONS.standardFiles.summary).toBe('SUMMARY.md');
    expect(PLAN_CONVENTIONS.standardFiles.status).toBe('STATUS.md');
    expect(PLAN_CONVENTIONS.standardFiles.executionPlan).toBe('EXECUTION_PLAN.md');
  });

  it('should have standard directories', () => {
    expect(PLAN_CONVENTIONS.standardDirs.plan).toBe('plan');
    expect(PLAN_CONVENTIONS.standardDirs.analysis).toBe('analysis');
  });

  it('should have status emoji mapping', () => {
    expect(PLAN_CONVENTIONS.statusEmoji.pending).toBe('⬜');
    expect(PLAN_CONVENTIONS.statusEmoji.in_progress).toBe('🔄');
    expect(PLAN_CONVENTIONS.statusEmoji.completed).toBe('✅');
    expect(PLAN_CONVENTIONS.statusEmoji.failed).toBe('❌');
    expect(PLAN_CONVENTIONS.statusEmoji.blocked).toBe('⏸️');
    expect(PLAN_CONVENTIONS.statusEmoji.skipped).toBe('⏭️');
  });
});

