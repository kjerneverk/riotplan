# RiotPlan

**Framework for long-lived, stateful AI workflows.**

RiotPlan helps you manage complex, multi-step AI-assisted tasks that span multiple sessions, have persistent state, and can be interrupted and resumed.

## What is a Plan?

A **plan** is a structured way to manage multi-step AI-assisted tasks that:

- **Span multiple sessions** - Work on a task over days or weeks
- **Have persistent state** - Track progress in STATUS.md
- **Are organized into steps** - Numbered files (01-STEP.md, 02-STEP.md)
- **Can be interrupted and resumed** - Pick up where you left off
- **Support collaboration** - Human reviews, feedback loops

## Quick Start

### Installation

```bash
npm install -g @riotprompt/riotplan
```

### Create Your First Plan

```bash
riotplan create my-feature
```

This will:
1. Prompt for your plan description
2. Ask if you want analysis first or direct generation
3. Use AI to generate detailed plan content
4. Create all plan files with actionable steps

### Check Status

```bash
riotplan status
```

### Execute Steps

```bash
# Start a step
riotplan step start 1

# Complete a step
riotplan step complete 1
```

## Plan Structure

```
my-plan/
├── my-plan-prompt.md     # Meta-prompt (original request)
├── SUMMARY.md            # Overview of the approach
├── EXECUTION_PLAN.md     # Step-by-step strategy
├── STATUS.md             # Current state (auto-updated)
└── plan/                 # Step files
    ├── 01-first-step.md
    ├── 02-second-step.md
    └── ...
```

## Key Features

### AI-Powered Generation

RiotPlan uses AI to generate detailed, actionable plans from your descriptions:

```bash
# Install AI provider
npm install @riotprompt/execution-anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# Create plan with AI
riotplan create my-feature
```

Get specific, actionable content tailored to your project instead of generic templates.

### Persistent State

STATUS.md tracks everything:
- Current progress and step
- Completed steps with timestamps
- Blockers and issues
- Execution history

### Step Management

```bash
# List steps
riotplan step list

# Start next pending step
riotplan step start

# Complete current step
riotplan step complete

# Add new step
riotplan step add "Integration Testing"
```

### Analysis Workflow

For complex plans, use analysis-first workflow:

```bash
# Create with analysis
riotplan create complex-feature --analyze

# Provide feedback
riotplan elaborate ./complex-feature

# Mark ready and generate
riotplan analysis ready ./complex-feature
riotplan generate ./complex-feature
```

## Status Indicators

| Symbol | Meaning |
|--------|---------|
| ⬜ | Pending |
| 🔄 | In Progress |
| ✅ | Completed |
| ❌ | Failed |
| ⏸️ | Blocked |
| ⏭️ | Skipped |

## MCP Integration

RiotPlan is available as an MCP (Model Context Protocol) server for AI assistants like Cursor.

Add to your Cursor MCP settings (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "riotplan": {
      "command": "npx",
      "args": ["-y", "@riotprompt/riotplan", "riotplan-mcp"]
    }
  }
}
```

This allows AI assistants to:
- Create and manage plans
- Track progress
- Execute steps
- Update status

## Programmatic Usage

```typescript
import { loadPlan, resumePlan } from '@riotprompt/riotplan';

// Load an existing plan
const plan = await loadPlan('./prompts/my-feature');

console.log(plan.metadata.code);     // 'my-feature'
console.log(plan.state.status);      // 'in_progress'
console.log(plan.state.currentStep); // 3

// Resume execution
const result = await resumePlan(plan);
```

## Documentation

### Guides

- [Getting Started](getting-started) - Installation and quick start
- [Core Concepts](core-concepts) - Understanding Plans, Steps, and STATUS.md
- [Plan Structure](plan-structure) - Anatomy of a plan directory
- [Creating Plans](creating-plans) - How to create and initialize plans
- [Managing Steps](managing-steps) - Working with plan steps

### CLI Reference

- [CLI Overview](cli-usage) - Command Line Interface overview
- [plan](cli-plan) - Initialize and manage plans
- [status](cli-status) - Check plan status and progress
- [step](cli-step) - Manage plan steps
- [feedback](cli-feedback) - Create and manage feedback records

### API Reference

- [API Reference](api-reference) - Complete API documentation
- [Programmatic Usage](programmatic-usage) - Using riotplan in your code
- [STATUS.md Format](status-format) - Understanding the STATUS.md file

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

## Real-World Examples

Plans in the wild:

```
prompts/
├── big-splitup/           # Codebase restructuring
├── commit-splitting/      # Feature implementation
├── parallel-execution/    # Complex feature with phases
├── shared-utils/          # Package extraction
└── ai-service/            # Service extraction
```

## Related Packages

- `@riotprompt/riotprompt` - Prompt modeling for single interactions
- `@riotprompt/agentic` - Multi-turn conversation framework
- `@riotprompt/execution` - LLM provider interfaces
- `@riotprompt/execution-anthropic` - Anthropic Claude provider
- `@riotprompt/execution-openai` - OpenAI GPT provider
- `@riotprompt/execution-gemini` - Google Gemini provider

## License

Apache-2.0

## Get Started

Ready to create your first plan?

[Get Started →](getting-started)
