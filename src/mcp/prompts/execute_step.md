# Execute Step Workflow

You are helping the user execute a single step from a plan, following the guidance in the step file and updating status appropriately.

## Your Task

Follow this workflow to execute a plan step using the riotplan MCP tools and resources available to you.

## Step 1: Check Plan Status

Use the `riotplan_status` tool to check the current plan state:

```
{
  "path": "${path}",
  "verbose": false
}
```

This will show you:
- Current step number
- Progress percentage
- Any blockers or issues
- Which step should be worked on next

Verify that prerequisites are met and identify which step to execute.

## Step 2: Read Step Details

Fetch the step resource to get full content and acceptance criteria:

```
riotplan://step/${path}?number={stepNumber}
```

Or use the `riotplan_step_list` tool to see all steps:

```
{
  "path": "${path}",
  "pending": true
}
```

Review the step content to understand:
- Objectives and goals
- Acceptance criteria
- Dependencies and context
- Testing requirements

## Step 3: Mark Step as Started

IMPORTANT: Use the `riotplan_step_start` MCP tool to mark the step as in progress:

```
{
  "path": "${path}",
  "step": N
}
```

This updates STATUS.md and sets timestamps to track progress.

## Step 4: Execute Step Tasks

Now follow the guidance in the step file:
- Implement required changes
- Write tests as specified
- Document as needed
- Follow acceptance criteria

Work through the step systematically, ensuring all requirements are met.

## Step 5: Verify Completion

Before marking the step complete, verify:
- All acceptance criteria are met
- Tests pass successfully
- Changes are complete and reviewed
- Documentation is updated if needed

## Step 6: Mark Step as Complete

IMPORTANT: Use the `riotplan_step_complete` MCP tool to mark the step as done:

```
{
  "path": "${path}",
  "step": N
}
```

This updates STATUS.md and advances the plan to the next step.

## Step 7: Check Overall Progress

Use `riotplan_status` again to see updated progress and identify the next step to work on.

## Important Guidelines

- **Always use MCP tools** - Never shell out to CLI commands
- **Update status properly** - Mark steps as started and completed
- **One step at a time** - Focus on completing one step fully before moving to the next
- **Test thoroughly** - Each step should include verification of acceptance criteria
- **Document issues** - If you encounter blockers, document them in STATUS.md

## Handling Issues

If you encounter problems during step execution:

### Step is Blocked
If you encounter blockers:
1. Inform the user about the blocker
2. Ask if the step needs to be split using `riotplan_step_add`
3. Consider if prerequisite steps are needed
4. Document the blocker for tracking

### Acceptance Criteria Unclear
If criteria are vague:
1. Ask the user for clarification
2. Suggest more specific tasks
3. Consider if the step needs more detail

### Step Too Large
If a step is too complex:
1. Suggest using `riotplan_step_add` to break it into smaller steps
2. Ask the user how they want to proceed
3. Consider completing the current step partially and adding follow-up steps

## Example Workflow

Here's how you should execute this workflow:

1. Call `riotplan_status` with path: "${path}"
2. Review the output and identify the current step
3. Fetch the step resource or list steps
4. Call `riotplan_step_start` with the step number
5. Execute the step tasks (implement, test, document)
6. Call `riotplan_step_complete` when done
7. Call `riotplan_status` again to see progress

Remember: Always use MCP tools, never shell commands.
