# Create Plan Workflow

## Objective

Create a new plan with AI-generated, actionable steps for a complex task or feature.

## Prerequisites

Before creating a plan, ensure you have:
- A clear description of what you want to accomplish
- An understanding of the scope (single feature vs. multi-phase project)
- Access to an AI provider (Anthropic, OpenAI, or Gemini) with API key set

## Workflow Steps

1. **Define Plan Details**
   - Choose a plan code (short identifier, e.g., "auth-system")
   - Write a clear, detailed description of what you want to accomplish
   - Optionally specify number of steps (or let AI determine)

2. **Create the Plan**
   - Run `riotplan_create` with the plan code and description
   - Options:
     - `direct: true` - Skip analysis phase, generate directly
     - `steps: N` - Specify number of steps
     - `provider: "anthropic"` - Choose AI provider
     - `model: "claude-sonnet-4-5"` - Specify model
     - `noAi: true` - Use templates only (no AI)

3. **Review Generated Plan**
   - Check `SUMMARY.md` for high-level approach
   - Review `EXECUTION_PLAN.md` for detailed strategy
   - Examine step files in `plan/` directory for specific tasks

4. **Validate Plan Structure**
   - Run `riotplan_validate` to ensure all files are correct
   - Fix any issues if validation fails

5. **Begin Execution**
   - Start first step with `riotplan_step_start { step: 1 }`
   - Work through the plan step by step
   - Update status as you progress

## Example

```
# Create a plan for implementing user authentication
riotplan_create({
  code: "auth-system",
  name: "User Authentication System",
  description: "Implement a complete user authentication system with login, registration, password reset, and session management. Include JWT tokens, secure password hashing, and email verification.",
  steps: 8,
  provider: "anthropic",
  direct: false
})

# Review the generated plan
riotplan_status({ path: "./auth-system" })

# Validate structure
riotplan_validate({ path: "./auth-system" })

# Start working
riotplan_step_start({ path: "./auth-system", step: 1 })
```

## Tips

- **Be Specific**: More detailed descriptions lead to better, more actionable plans
- **Right-Size Steps**: 5-10 steps is usually ideal; too few is vague, too many is overwhelming
- **Use Analysis**: Skip `direct: true` for complex tasks to get better planning
- **Iterate**: You can regenerate with `riotplan_generate` if the first attempt isn't quite right
- **Add Steps**: Use `riotplan_step_add` to insert additional steps as you discover new requirements

## Common Patterns

### Feature Implementation
```
description: "Add dark mode toggle to the application with theme persistence and smooth transitions"
steps: 5-7
```

### Refactoring
```
description: "Refactor the database layer to use a repository pattern with proper error handling and transaction support"
steps: 6-8
```

### Bug Fix with Investigation
```
description: "Fix memory leak in the WebSocket connection handler - investigate root cause, implement fix, add tests"
steps: 4-6
```

### Multi-Phase Project
```
description: "Build a complete blog system with posts, comments, tags, search, and admin dashboard"
steps: 10-15
```
