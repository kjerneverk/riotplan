# Managing Steps

Learn how to work with plan steps - listing, starting, completing, and adding steps to your plans.

## Overview

Steps are the fundamental units of work in a plan. Each step:
- Has a unique number (01, 02, 03, etc.)
- Contains specific tasks and acceptance criteria
- Tracks its own status independently
- Can depend on other steps

## Listing Steps

### Show All Steps

```bash
riotplan step list
```

Example output:

```
✅ 01 analysis
✅ 02 design
✅ 03 architecture
✅ 04 implementation-core
🔄 05 implementation-api
⬜ 06 testing
⬜ 07 documentation
⬜ 08 release
```

### Show Only Pending Steps

```bash
riotplan step list --pending
```

Output:

```
⬜ 06 testing
⬜ 07 documentation
⬜ 08 release
```

### Show All Steps (Including Completed)

```bash
riotplan step list --all
```

### JSON Output

```bash
riotplan step list --json
```

Output:

```json
{
  "steps": [
    {
      "number": 1,
      "title": "analysis",
      "status": "completed",
      "file": "plan/01-analysis.md",
      "started": "2026-01-08",
      "completed": "2026-01-08"
    },
    {
      "number": 5,
      "title": "implementation-api",
      "status": "in_progress",
      "file": "plan/05-implementation-api.md",
      "started": "2026-01-10",
      "completed": null
    }
  ]
}
```

## Starting Steps

### Start Next Pending Step

```bash
riotplan step start
```

This finds the first pending step and marks it as in-progress.

### Start Specific Step

```bash
riotplan step start 05
```

### What Happens

When you start a step:
1. STATUS.md is updated
2. Step status changes to 🔄 In Progress
3. Start timestamp is recorded
4. Current step pointer is updated

**STATUS.md update:**

```markdown
| 05 | Implementation API | 🔄 In Progress | 2026-01-10 | - | - |
```

## Completing Steps

### Complete Current Step

```bash
riotplan step complete
```

### Complete Specific Step

```bash
riotplan step complete 05
```

### What Happens

When you complete a step:
1. STATUS.md is updated
2. Step status changes to ✅ Completed
3. Completion timestamp is recorded
4. Progress percentage is updated
5. Current step advances to next pending

**STATUS.md update:**

```markdown
| 05 | Implementation API | ✅ Completed | 2026-01-10 | 2026-01-10 | All endpoints working |
```

## Adding Steps

### Add Step at End

```bash
riotplan step add "Integration Testing"
```

Creates `plan/09-integration-testing.md` (assuming 8 steps exist).

### Add Step at Specific Position

```bash
riotplan step add "Security Audit" --number 07
```

Creates `plan/07-security-audit.md` and renumbers subsequent steps:
- Old `07-documentation.md` → `08-documentation.md`
- Old `08-release.md` → `09-release.md`

### Add Step After Another

```bash
riotplan step add "Code Review" --after 05
```

Creates `plan/06-code-review.md` and renumbers subsequent steps.

### What Happens

When you add a step:
1. New step file is created
2. Subsequent steps are renumbered
3. STATUS.md is updated with new step
4. EXECUTION_PLAN.md may need manual update

## Step Status Indicators

| Symbol | Status | Meaning |
|--------|--------|---------|
| ⬜ | `pending` | Not started |
| 🔄 | `in_progress` | Currently active |
| ✅ | `completed` | Done |
| ❌ | `failed` | Failed with error |
| ⏸️ | `blocked` | Waiting on dependency |
| ⏭️ | `skipped` | Intentionally skipped |

## Marking Steps as Failed

```bash
riotplan step fail 05 "Database migration error"
```

Updates STATUS.md:

```markdown
| 05 | Implementation API | ❌ Failed | 2026-01-10 | - | Database migration error |
```

## Marking Steps as Blocked

```bash
riotplan step block 06 "Waiting for API key from DevOps"
```

Updates STATUS.md:

```markdown
| 06 | Testing | ⏸️ Blocked | - | - | Waiting for API key |
```

And adds to Blockers section:

```markdown
## Blockers

- Step 06 (Testing): Waiting for API key from DevOps team
```

## Skipping Steps

```bash
riotplan step skip 07 "Documentation will be done separately"
```

Updates STATUS.md:

```markdown
| 07 | Documentation | ⏭️ Skipped | - | - | Will be done separately |
```

## Viewing Step Details

### Read Step File

```bash
riotplan step show 05
```

Displays the full content of `plan/05-implementation-api.md`.

### Show Step Status

```bash
riotplan step status 05
```

Output:

```
Step 05: Implementation API
Status: 🔄 In Progress
File: plan/05-implementation-api.md
Started: 2026-01-10
Progress: 50%

Tasks:
- [x] Create Express routes
- [x] Add validation middleware
- [ ] Implement error handling
- [ ] Add rate limiting
```

## Step Dependencies

### Viewing Dependencies

```bash
riotplan step deps 05
```

Output:

```
Step 05: Implementation API

Prerequisites:
- Step 01 (Analysis) ✅ Completed
- Step 02 (Design) ✅ Completed
- Step 04 (Core Implementation) ✅ Completed

Blocks:
- Step 06 (Testing)
- Step 07 (Documentation)
```

### Dependency Validation

RiotPlan validates dependencies:

```bash
riotplan step start 06
```

If step 05 is not complete:

```
Error: Cannot start step 06 (Testing)
Reason: Prerequisite step 05 (Implementation API) is not completed

Current status of step 05: In Progress
```

## Programmatic Usage

### List Steps

```typescript
import { loadPlan } from '@riotprompt/riotplan';

const plan = await loadPlan('./my-feature');

// Get all steps
const allSteps = plan.steps;

// Get pending steps
const pendingSteps = plan.steps.filter(s => s.status === 'pending');

// Get current step
const currentStep = plan.steps.find(s => s.number === plan.state.currentStep);
```

### Start Step

```typescript
import { loadPlan, startStep } from '@riotprompt/riotplan';

const plan = await loadPlan('./my-feature');
const updatedPlan = await startStep(plan, 5);
```

### Complete Step

```typescript
import { loadPlan, completeStep } from '@riotprompt/riotplan';

const plan = await loadPlan('./my-feature');
const updatedPlan = await completeStep(plan, 5, {
  notes: 'All endpoints working correctly'
});
```

### Add Step

```typescript
import { loadPlan, addStep } from '@riotprompt/riotplan';

const plan = await loadPlan('./my-feature');
const updatedPlan = await addStep(plan, {
  title: 'Integration Testing',
  description: 'Test all components together',
  after: 5  // Insert after step 5
});
```

## Best Practices

### Step Granularity

**Good:**
- Each step completable in one session (1-4 hours)
- Clear deliverables
- Testable outcomes

**Too Large:**
- "Implement entire feature" (break into smaller steps)
- Multiple days of work
- Unclear when "done"

**Too Small:**
- "Add import statement"
- Trivial changes
- No meaningful checkpoint

### Naming Steps

**Good:**
- `01-database-schema.md`
- `02-user-model.md`
- `03-authentication-endpoints.md`

**Not as good:**
- `01-db.md` (too abbreviated)
- `02-stuff.md` (not descriptive)
- `03-do-the-thing.md` (vague)

### Recording Progress

Add notes when completing steps:

```bash
riotplan step complete 05 --notes "Implemented all CRUD endpoints. Added validation. Rate limiting pending."
```

This helps when resuming work later.

### Handling Failures

When a step fails:

1. **Mark as failed** with reason:
   ```bash
   riotplan step fail 05 "Database migration error"
   ```

2. **Document in Issues**:
   ```bash
   riotplan issue add "Step 05 failed: Missing foreign key constraint"
   ```

3. **Decide action**:
   - Fix and retry
   - Skip with justification
   - Block until resolved

### Dependencies

Document dependencies in step files:

```markdown
## Prerequisites
- Step 01 (Analysis) must be completed
- Step 02 (Design) must be completed
- Database must be configured
```

RiotPlan validates these automatically.

## Troubleshooting

### Step numbering is wrong

```bash
riotplan plan validate --fix
```

This renumbers steps to fix gaps or duplicates.

### Can't start a step

Check dependencies:

```bash
riotplan step deps 06
```

Ensure all prerequisites are completed.

### STATUS.md out of sync

Regenerate STATUS.md:

```bash
riotplan status --regenerate
```

## Next Steps

- Learn about [CLI Usage](cli-usage) - Complete command reference
- Explore [STATUS.md Format](status-format) - Understanding status tracking
- Read [Programmatic Usage](programmatic-usage) - Using the API
- Understand [Plan Structure](plan-structure) - Plan anatomy
