# Execute Step Workflow

## Objective

Execute a single step from a plan, following the guidance in the step file and updating status appropriately.

## Prerequisites

Before executing a step:
- Plan must exist and be validated
- Previous steps should be completed (unless step is independent)
- Step file should contain clear acceptance criteria

**Status Resource**: `riotplan://status/${path}`
- Shows current plan status and progress
- Identifies current step and blockers

**Step Resource**: `riotplan://step/${path}/${stepNumber}`
- Provides step details and content
- Shows acceptance criteria and testing requirements

## Workflow Steps

1. **Check Plan Status**
   - Run `riotplan_status` to see current state
   - Verify prerequisites are met
   - Identify which step to work on

2. **Read Step Details**
   - Fetch the step resource to get full content
   - Review objectives and acceptance criteria
   - Understand dependencies and context

3. **Mark Step as Started**
   - Run `riotplan_step_start { step: N }` to update status
   - This updates STATUS.md and sets timestamps

4. **Execute Step Tasks**
   - Follow the guidance in the step file
   - Implement required changes
   - Write tests as specified
   - Document as needed

5. **Verify Completion**
   - Check all acceptance criteria are met
   - Run tests to ensure quality
   - Review changes for completeness

6. **Mark Step as Complete**
   - Run `riotplan_step_complete { step: N }` to update status
   - This advances the plan to the next step

7. **Check Overall Progress**
   - Run `riotplan_status` to see updated progress
   - Identify next step to work on

## Example Flow

```
# Check current status
riotplan_status({ path: "./my-feature" })
→ Shows step 3 is current

# Read step 3 details
Fetch riotplan://step/my-feature/3
→ Get full step content and criteria

# Start the step
riotplan_step_start({ path: "./my-feature", step: 3 })
→ Marks step as in progress

# ... do the work ...
# (implement features, write tests, etc.)

# Complete the step
riotplan_step_complete({ path: "./my-feature", step: 3 })
→ Marks step as done, advances to step 4

# Check progress
riotplan_status({ path: "./my-feature" })
→ Shows step 4 is now current, 60% complete
```

## Handling Issues

### Step is Blocked
If you encounter blockers:
1. Document the blocker in STATUS.md
2. Consider if the step needs to be split
3. Use `riotplan_step_add` to insert prerequisite steps
4. Mark current step as blocked if needed

### Acceptance Criteria Unclear
If criteria are vague:
1. Elaborate on the step with more specific tasks
2. Consider using `riotplan_generate` to regenerate with more detail
3. Add notes to the step file for clarity

### Step Too Large
If a step is too complex:
1. Use `riotplan_step_add` to break it into smaller steps
2. Complete the current step partially
3. Add follow-up steps for remaining work

## Tips

- **One Step at a Time**: Focus on completing one step fully before moving to the next
- **Update Frequently**: Mark steps as started/completed to maintain accurate status
- **Test Thoroughly**: Each step should include verification of its acceptance criteria
- **Document Issues**: Add notes to STATUS.md about any problems or decisions
- **Stay Flexible**: Plans can evolve - add steps as needed when you discover new requirements

## Integration with Development Workflow

### With Version Control
```
# Start step
riotplan_step_start({ step: 3 })

# Do the work
# ... implement changes ...

# Commit changes
git add .
git commit -m "feat: implement step 3 - user authentication"

# Complete step
riotplan_step_complete({ step: 3 })
```

### With Testing
```
# Start step
riotplan_step_start({ step: 4 })

# Implement and test
# ... write code ...
npm test

# Verify coverage
npm run test:coverage

# Complete step
riotplan_step_complete({ step: 4 })
```

### With Code Review
```
# Start step
riotplan_step_start({ step: 5 })

# Implement
# ... write code ...

# Create PR
git push origin feature-branch
gh pr create

# After review and merge
riotplan_step_complete({ step: 5 })
```
