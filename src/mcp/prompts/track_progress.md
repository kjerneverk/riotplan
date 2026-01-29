# Track Progress Workflow

## Objective

Monitor plan progress, identify blockers, and maintain accurate status tracking throughout plan execution.

## Prerequisites

**Status Resource**: `riotplan://status/${path}`
- Current plan state and progress
- Active blockers and issues
- Step completion status

**Steps Resource**: `riotplan://steps/${path}`
- List of all steps with status
- Step dependencies and ordering

## Workflow Steps

1. **Check Overall Status**
   - Run `riotplan_status` to see high-level progress
   - Review completion percentage
   - Identify current step

2. **Review Step Progress**
   - Run `riotplan_step_list` to see all steps
   - Filter with `pending: true` to see remaining work
   - Check for any blocked steps

3. **Identify Issues**
   - Look for blockers in status output
   - Check for steps that are taking longer than expected
   - Review any issues or notes

4. **Update Status**
   - Mark steps as started when beginning work
   - Mark steps as completed when done
   - Add notes about blockers or issues

5. **Adjust Plan if Needed**
   - Add new steps if requirements emerge
   - Split large steps into smaller ones
   - Update step content if approach changes

## Example Tracking Session

```
# Get overall status
riotplan_status({ path: "./my-feature" })
→ 45% complete (5/11 steps)
→ Current: step 6
→ Blockers: None
→ Issues: 1 (low priority)

# List all steps
riotplan_step_list({ path: "./my-feature" })
→ ✅ 01 analysis
→ ✅ 02 design
→ ✅ 03 architecture
→ ✅ 04 implementation-core
→ ✅ 05 implementation-api
→ 🔄 06 testing
→ ⬜ 07 documentation
→ ⬜ 08 deployment-prep
→ ⬜ 09 staging-deploy
→ ⬜ 10 validation
→ ⬜ 11 production-deploy

# List only pending steps
riotplan_step_list({ path: "./my-feature", pending: true })
→ ⬜ 07 documentation
→ ⬜ 08 deployment-prep
→ ⬜ 09 staging-deploy
→ ⬜ 10 validation
→ ⬜ 11 production-deploy

# Verbose status with step details
riotplan_status({ path: "./my-feature", verbose: true })
→ Includes timestamps for each step
→ Shows when steps were started/completed
→ Provides detailed blocker information
```

## Status Indicators

| Symbol | Status | Meaning |
|--------|--------|---------|
| ⬜ | Pending | Not yet started |
| 🔄 | In Progress | Currently being worked on |
| ✅ | Completed | Done and verified |
| ❌ | Failed | Attempted but failed |
| ⏸️ | Blocked | Waiting on dependency or external factor |
| ⏭️ | Skipped | Intentionally skipped |

## Monitoring Best Practices

### Daily Check-In
```
# Morning: Check status and plan the day
riotplan_status({ path: "./current-plan" })
riotplan_step_list({ path: "./current-plan", pending: true })

# Identify today's work
# Start the step
riotplan_step_start({ step: N })

# Evening: Update status
riotplan_step_complete({ step: N })
# or document blockers if incomplete
```

### Weekly Review
```
# Check overall progress
riotplan_status({ path: "./current-plan", verbose: true })

# Review all steps
riotplan_step_list({ path: "./current-plan", all: true })

# Assess:
# - Are we on track?
# - Any blockers to address?
# - Need to adjust the plan?
# - Add/remove steps?
```

### Handling Blockers

When a blocker is identified:

1. **Document It**
   - Add to STATUS.md blockers section
   - Include details about what's blocking progress
   - Note any dependencies or external factors

2. **Assess Impact**
   - Can other steps proceed in parallel?
   - How critical is this blocker?
   - What's needed to unblock?

3. **Take Action**
   - If waiting on external dependency, work on other steps
   - If technical blocker, investigate and resolve
   - If scope issue, adjust plan accordingly

4. **Update When Resolved**
   - Remove from blockers list
   - Resume the blocked step
   - Update status to reflect resolution

## Progress Reporting

### For Stakeholders
```
riotplan_status({ path: "./project", verbose: true })

Extract key metrics:
- Completion percentage
- Steps completed vs. total
- Current phase/step
- Estimated remaining work
- Any blockers or risks
```

### For Team Coordination
```
# Share current status
riotplan_status({ path: "./shared-project" })

# Identify parallel work opportunities
riotplan_step_list({ path: "./shared-project", pending: true })

# Coordinate who works on what
# Update as team members complete steps
```

## Adjusting Plans Mid-Flight

### Adding Steps
```
# Discovered new requirement during step 5
riotplan_step_add({
  path: "./my-plan",
  title: "Security Audit",
  after: 5
})

# Steps are renumbered automatically
# Continue with updated plan
```

### Splitting Steps
```
# Step 7 is too large
riotplan_step_add({
  path: "./my-plan",
  title: "Integration Tests - Unit",
  after: 6
})

riotplan_step_add({
  path: "./my-plan",
  title: "Integration Tests - E2E",
  after: 7
})

# Original step 7 can be updated or removed
```

## Tips

- **Check Status Frequently**: Quick status checks keep you oriented
- **Update Promptly**: Mark steps as started/completed as they happen
- **Document Blockers**: Don't let blockers go unrecorded
- **Be Honest**: Accurate status is more valuable than optimistic status
- **Adjust Freely**: Plans should evolve as you learn more
- **Use Verbose Mode**: When you need details, verbose output helps
- **Filter Wisely**: Use `pending` filter to focus on remaining work
