# riotplan

Framework for long-lived, stateful AI workflows (plans).

**Now available as an MCP server!** Integrate with Cursor and other AI assistants - see [MCP Integration](#mcp-integration) below.

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
npm install -g @riotprompt/riotplan
```

Or as a development dependency:

```bash
npm install --save-dev @riotprompt/riotplan
```

### AI-Powered Generation (Optional)

`riotplan` can use AI to generate detailed, actionable plans from your descriptions. Install an execution provider:

```bash
# For Anthropic Claude (recommended)
npm install @riotprompt/execution-anthropic

# For OpenAI GPT
npm install @riotprompt/execution-openai

# For Google Gemini
npm install @riotprompt/execution-gemini
```

Set your API key:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="..."
```

Without an AI provider, `riotplan` falls back to template-based generation.

## Command-Line Interface

### Creating a Plan

Create a new plan with AI generation:

```bash
riotplan create my-feature
```

This will:
1. Prompt for your plan description (opens editor)
2. Ask if you want analysis first or direct generation
3. Use AI to generate detailed plan content
4. Create all plan files with actionable steps

Options:

```bash
riotplan create my-feature --direct           # Skip analysis, generate directly
riotplan create my-feature --steps 7          # Specify number of steps
riotplan create my-feature --provider anthropic  # Choose AI provider
riotplan create my-feature --model claude-sonnet-4-5  # Specify model
riotplan create my-feature --no-ai            # Use templates only
```

Creates:

```
my-feature/
├── my-feature-prompt.md     # Your original description
├── SUMMARY.md               # AI-generated overview and approach
├── EXECUTION_PLAN.md        # Step-by-step strategy
├── STATUS.md                # Current state tracking
└── plan/
    ├── 01-analysis.md       # Detailed step with specific tasks
    ├── 02-design.md         # Concrete acceptance criteria
    ├── 03-implementation.md # Testing strategies
    └── ...
```

**AI vs Templates**: With AI, you get specific, actionable content tailored to your project. Without AI, you get template files with placeholders to fill in manually.

### Checking Status

Show current plan status:

```bash
riotplan status                 # Current directory
riotplan status ./my-plan       # Specific path
riotplan status -v              # Verbose output
riotplan status --json          # JSON output
```

Example output:

```
Plan: my-feature
Status: 🔄 in_progress
Progress: 45% (5/11 steps)
Current Step: 06-testing
Last Updated: 2026-01-10

Blockers: None
Issues: 1 (low priority)
```

### Managing Steps

List steps in a plan:

```bash
riotplan step list              # All steps
riotplan step list --pending    # Only pending
riotplan step list --all        # Include completed
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

Add a new step:

```bash
riotplan step add "Integration Testing"
riotplan step add "Security Audit" --number 07
riotplan step add "Review" --after 05
```

Mark steps as started or completed:

```bash
riotplan step start 05
riotplan step complete 05
```

### Managing Feedback

Create and list feedback records:

```bash
riotplan feedback create        # Create feedback record
riotplan feedback list          # List feedback records
```

### Validating Plans

Validate plan structure:

```bash
riotplan plan validate          # Current directory
riotplan plan validate ./my-plan # Specific path
riotplan plan validate --fix    # Attempt to fix issues
```

Checks:
- Required files exist (STATUS.md, EXECUTION_PLAN.md, etc.)
- STATUS.md is parseable
- Step files have valid numbering (01-*, 02-*, etc.)
- Step dependencies are valid
- No circular dependencies

Archive a completed plan:

```bash
riotplan plan archive           # Current directory
riotplan plan archive ./my-plan # Specific path
```

### Status Indicators

| Symbol | Meaning |
|--------|---------|
| ⬜ | Pending |
| 🔄 | In Progress |
| ✅ | Completed |
| ❌ | Failed |
| ⏸️ | Blocked |
| ⏭️ | Skipped |

### Generate from Existing Prompt

If you already have a plan directory with a prompt file:

```bash
riotplan generate ./my-plan --steps 5
riotplan generate ./my-plan --provider anthropic --model claude-sonnet-4-5
```

### Configuration

Create `.riotplanrc.json` in your plan directory:

```json
{
  "defaultProvider": "anthropic",
  "autoUpdateStatus": true,
  "stepTemplate": "detailed",
  "analysis": {
    "enabled": true,
    "directory": "analysis"
  }
}
```

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

- `@riotprompt/riotprompt` - Prompt modeling for single interactions
- `@riotprompt/agentic` - Multi-turn conversation framework
- `@riotprompt/execution` - LLM provider interfaces
- `@riotprompt/riotplan-commands-*` - Command packages (plan, status, step, feedback)

## MCP Integration

RiotPlan is available as an MCP (Model Context Protocol) server, allowing AI assistants like Cursor to manage plans directly.

### Setup

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

### MCP Tools

- **`riotplan_create`** - Create new plans with AI-generated steps
- **`riotplan_status`** - Show plan status and progress
- **`riotplan_step_list`** - List all steps
- **`riotplan_step_start`** - Mark step as started
- **`riotplan_step_complete`** - Mark step as completed
- **`riotplan_step_add`** - Add new steps dynamically
- **`riotplan_validate`** - Validate plan structure
- **`riotplan_generate`** - Generate plan content with AI

### MCP Resources

Read-only access to plan data:

- `riotplan://plan/{path}` - Plan metadata and structure
- `riotplan://status/{path}` - Current status and progress
- `riotplan://steps/{path}` - List of all steps
- `riotplan://step/{path}?number={n}` - Specific step content

### MCP Prompts

Workflow templates for common tasks:

- **`create_plan`** - Guided plan creation workflow
- **`execute_step`** - Step execution workflow with status tracking
- **`track_progress`** - Progress monitoring and status updates

### Example MCP Usage

```typescript
// AI assistant creates a plan
riotplan_create({
  code: "user-auth",
  description: "Implement JWT-based authentication",
  steps: 6
})

// Check status
riotplan_status({ path: "./user-auth" })

// Start and complete steps
riotplan_step_start({ path: "./user-auth", step: 1 })
// ... do the work ...
riotplan_step_complete({ path: "./user-auth", step: 1 })
```

See [guide/mcp.md](./guide/mcp.md) for detailed MCP documentation.

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
