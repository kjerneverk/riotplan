# Usage Patterns

**Purpose**: Common patterns for using `riotplan` via CLI and Library.

## Plan Directory Structure

RiotPlan expects a specific directory structure for a plan. The directory name becomes the plan code.

```
my-feature/
├── my-feature-prompt.md     # Meta-prompt (initial planning prompt)
├── SUMMARY.md               # Overview of the approach
├── EXECUTION_PLAN.md        # Detailed execution strategy
├── STATUS.md                # Current state tracking
├── plan/                    # Step files directory
│   ├── 01-analysis.md
│   ├── 02-design.md
│   ├── 03-implementation.md
│   ├── 04-testing.md
│   └── 05-documentation.md
└── analysis/                # Analysis output (optional)
```

## CLI Usage

### Creating a New Plan

```bash
# Create a basic plan
riotplan init my-feature

# Create with description
riotplan init my-feature --description "Implement user authentication"

# Create with specific number of steps
riotplan init my-feature --steps 5
```

### Checking Plan Status

```bash
# Show status of plan in current directory
riotplan status

# Show status of specific plan
riotplan status ./prompts/my-feature

# Verbose output with all details
riotplan status -v

# Output as JSON for scripting
riotplan status --json
```

### Listing Steps

```bash
# List all steps
riotplan list

# List only pending steps
riotplan list --pending
```

Example output:
```
✅ 01 analysis
✅ 02 design
🔄 03 implementation
⬜ 04 testing
⬜ 05 documentation
```

### Executing Steps

```bash
# Execute the next pending step
riotplan execute

# Execute a specific step
riotplan execute 03

# Preview what would be executed
riotplan execute --dry-run
```

### Resuming Plans

```bash
# Resume from STATUS.md
riotplan resume

# Skip any failed steps
riotplan resume --skip-failed

# Resume from a specific step
riotplan resume --from 03
```

## Library Usage

### Loading a Plan

```typescript
import { loadPlan } from 'riotplan';

const plan = await loadPlan('./prompts/my-feature');

console.log(plan.metadata.code);     // 'my-feature'
console.log(plan.metadata.name);     // 'My Feature Implementation'
console.log(plan.state.status);      // 'in_progress'
console.log(plan.state.currentStep); // 3
console.log(plan.state.progress);    // 40 (percentage)
```

### Creating a Plan

```typescript
import { createPlan } from 'riotplan';

const plan = await createPlan({
    code: 'user-auth',
    name: 'User Authentication',
    path: './prompts/user-auth',
    description: 'Implement secure user authentication',
    steps: [
        { title: 'Requirements Analysis', description: 'Gather and document requirements' },
        { title: 'Security Design', description: 'Design authentication flow' },
        { title: 'Implementation', description: 'Build the authentication system' },
        { title: 'Testing', description: 'Write tests and verify security' },
        { title: 'Documentation', description: 'Document the system' }
    ]
});
```

### Working with Steps

```typescript
import { loadPlan, executeStep, updatePlanState } from 'riotplan';

const plan = await loadPlan('./prompts/my-feature');

// Get pending steps
const pendingSteps = plan.steps.filter(s => s.status === 'pending');

// Execute a step
const result = await executeStep(plan, 3, {
    logger: console,
    // Optional: LLM execution context
});

// Update state after completion
const updatedPlan = updatePlanState(plan, 3, result);
```

### Resuming Execution

```typescript
import { loadPlan, resumePlan } from 'riotplan';

const plan = await loadPlan('./prompts/my-feature');

// Resume from current state
const result = await resumePlan(plan, {
    logger: console,
    skipFailed: false
});

console.log(result.success);          // true
console.log(result.completedSteps);   // [3, 4, 5]
console.log(result.duration);         // 12500 (ms)
```

## STATUS.md Format

The STATUS.md file tracks plan progress:

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
| 02 | Design | ✅ Completed | 2026-01-08 | 2026-01-09 | Revised twice |
| 03 | Implementation | 🔄 In Progress | 2026-01-09 | - | 50% done |
| 04 | Testing | ⬜ Pending | - | - | - |
| 05 | Documentation | ⬜ Pending | - | - | - |

## Blockers

_No blockers currently._

## Issues

- Minor: Need to decide on session storage strategy

## Notes

Implementation is progressing well. May need to add step 06 for deployment.
```

## Status Indicators

| Symbol | Status | Meaning |
|--------|--------|---------|
| ⬜ | `pending` | Not started |
| 🔄 | `in_progress` | Currently active |
| ✅ | `completed` | Done |
| ❌ | `failed` | Failed with error |
| ⏸️ | `blocked` | Waiting on dependency |
| ⏭️ | `skipped` | Intentionally skipped |
