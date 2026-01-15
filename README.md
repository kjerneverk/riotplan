# riotplan

Framework for long-lived, stateful AI workflows (plans).

## What is a Plan?

A **plan** is a structured way to manage multi-step AI-assisted tasks that:

- **Span multiple sessions** - Work on a task over days or weeks
- **Have persistent state** - Track progress in STATUS.md
- **Are organized into steps** - Numbered files (01-STEP.md, 02-STEP.md)
- **Can be interrupted and resumed** - Pick up where you left off
- **Support collaboration** - Human reviews, feedback loops

## Plan Structure

```
my-plan/
├── my-plan-prompt.md     # Meta-prompt (prompt-of-prompts)
├── SUMMARY.md            # Overview of the approach
├── EXECUTION_PLAN.md     # Step-by-step strategy
├── STATUS.md             # Current state (auto-updated)
├── plan/                 # Step files
│   ├── 01-first-step.md
│   ├── 02-second-step.md
│   └── ...
└── analysis/             # Analysis output (optional)
```

### Key Files

| File | Purpose |
|------|---------|
| `{code}-prompt.md` | Initial meta-prompt that creates the plan |
| `SUMMARY.md` | High-level overview of the approach |
| `EXECUTION_PLAN.md` | Detailed execution strategy |
| `STATUS.md` | Current state, progress tracking |
| `01-*.md`, `02-*.md` | Individual step prompts |

## Real-World Examples

Plans in the wild:

```
grunnverk/prompts/
├── big-splitup/           # Codebase restructuring
├── commit-splitting/      # Feature implementation
├── parallel-execution/    # Complex feature with phases
├── shared-utils/          # Package extraction
└── ai-service/            # Service extraction
```

## Installation

```bash
npm install riotplan
```

## Usage (Coming Soon)

```typescript
import { loadPlan, resumePlan } from 'riotplan';

// Load an existing plan
const plan = await loadPlan('./prompts/my-feature');

console.log(plan.metadata.code);     // 'my-feature'
console.log(plan.state.status);      // 'in_progress'
console.log(plan.state.currentStep); // 3

// Resume execution
const result = await resumePlan(plan);
```

## Creating a Plan

```typescript
import { createPlan } from 'riotplan';

const plan = await createPlan({
  code: 'my-feature',
  name: 'My Feature Implementation',
  path: './prompts/my-feature',
  description: 'Implement the new feature with proper testing',
  steps: [
    { title: 'Analysis', description: 'Analyze requirements' },
    { title: 'Design', description: 'Design the solution' },
    { title: 'Implementation', description: 'Build it' },
    { title: 'Testing', description: 'Verify it works' },
    { title: 'Documentation', description: 'Document it' },
  ]
});
```

## STATUS.md Format

```markdown
# My Feature - Execution Status

## Current State

| Field | Value |
|-------|-------|
| **Status** | `in_progress` |
| **Current Step** | 03-implementation |
| **Last Completed** | 02-design |
| **Started At** | 2026-01-08 |
| **Last Updated** | 2026-01-10 |

## Step Progress

| Step | Name | Status | Started | Completed | Notes |
|------|------|--------|---------|-----------|-------|
| 01 | Analysis | ✅ Completed | 2026-01-08 | 2026-01-08 | - |
| 02 | Design | ✅ Completed | 2026-01-08 | 2026-01-09 | - |
| 03 | Implementation | 🔄 In Progress | 2026-01-09 | - | 50% done |
| 04 | Testing | ⬜ Pending | - | - | - |
| 05 | Documentation | ⬜ Pending | - | - | - |

## Blockers

_No blockers currently._

## Issues

_No issues encountered._
```

## Roadmap

### v0.1.0 - Core Functionality
- [ ] Load plans from directories
- [ ] Parse STATUS.md
- [ ] Generate STATUS.md
- [ ] Step file discovery

### v0.2.0 - Execution
- [ ] Execute individual steps
- [ ] Resume from checkpoint
- [ ] Update state automatically

### v0.3.0 - Integration
- [ ] CLI (riotplan-cli)
- [ ] Agentic execution
- [ ] Riotprompt integration

## Related Packages

- `riotprompt` - Prompt modeling for single interactions
- `agentic` - Multi-turn conversation framework
- `execution` - LLM provider interfaces
- `riotplan-cli` - Command-line interface (coming soon)

## Philosophy

Plans bridge the gap between:
- **Prompts** (single interactions)
- **Agentic conversations** (multi-turn sessions)
- **Long-running workflows** (days/weeks of work)

A plan provides structure for complex, iterative AI-assisted work where:
- The work can't be done in one session
- Progress needs to be tracked
- Humans need to review and provide feedback
- The approach may evolve based on findings

## License

Apache-2.0

<!-- v1.0.0 -->

