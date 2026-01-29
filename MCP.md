# RiotPlan MCP Server

RiotPlan is available as an MCP (Model Context Protocol) server, allowing AI assistants to manage long-lived, stateful workflows directly.

## Installation

### As a Global Package

```bash
npm install -g @riotprompt/riotplan
```

### In Cursor

Add to your Cursor MCP settings (`~/.cursor/mcp.json` or workspace settings):

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

Or if installed globally:

```json
{
  "mcpServers": {
    "riotplan": {
      "command": "riotplan-mcp"
    }
  }
}
```

## Features

### Tools

RiotPlan exposes the following tools via MCP:

#### Plan Management

- **`riotplan_create`** - Create a new plan with AI-generated steps
  - Parameters: `code`, `description`, `name`, `directory`, `steps`, `direct`, `provider`, `model`, `noAi`
  - Creates a complete plan structure with actionable steps

- **`riotplan_status`** - Show current plan status and progress
  - Parameters: `path`, `verbose`
  - Returns status, progress percentage, current step, blockers, and issues

- **`riotplan_validate`** - Validate plan structure and files
  - Parameters: `path`, `fix`
  - Checks for required files, valid STATUS.md, step numbering

- **`riotplan_generate`** - Generate plan from existing prompt file
  - Parameters: `path`, `steps`, `provider`, `model`
  - Regenerates plan content from prompt

#### Step Management

- **`riotplan_step_list`** - List all steps in a plan
  - Parameters: `path`, `pending`, `all`
  - Returns step numbers, titles, status, and files

- **`riotplan_step_start`** - Mark a step as started
  - Parameters: `path`, `step`
  - Updates STATUS.md to reflect in-progress status

- **`riotplan_step_complete`** - Mark a step as completed
  - Parameters: `path`, `step`
  - Updates STATUS.md to reflect completion

- **`riotplan_step_add`** - Add a new step to the plan
  - Parameters: `path`, `title`, `number`, `after`
  - Inserts a new step at specified position

### Resources

RiotPlan provides read-only access to plan data via resources:

- **`riotplan://plan/{path}`** - Plan metadata and structure
- **`riotplan://status/{path}`** - Current status and progress
- **`riotplan://steps/{path}`** - List of all steps
- **`riotplan://step/{path}?number={n}`** - Specific step content

### Prompts

RiotPlan includes workflow templates:

- **`create_plan`** - Guided workflow for creating a new plan
- **`execute_step`** - Workflow for executing a single step
- **`track_progress`** - Workflow for monitoring plan progress

## Usage Examples

### Creating a Plan

```typescript
// Use the riotplan_create tool
{
  code: "auth-system",
  name: "User Authentication System",
  description: "Implement complete user authentication with login, registration, password reset, and session management",
  steps: 8,
  provider: "anthropic"
}
```

### Checking Status

```typescript
// Use the riotplan_status tool
{
  path: "./auth-system",
  verbose: true
}
```

### Managing Steps

```typescript
// Start a step
{
  path: "./auth-system",
  step: 3
}

// Complete a step
{
  path: "./auth-system",
  step: 3
}

// Add a new step
{
  path: "./auth-system",
  title: "Security Audit",
  after: 5
}
```

### Reading Resources

```typescript
// Fetch plan status
const status = await fetchResource("riotplan://status/auth-system");

// Fetch specific step content
const step = await fetchResource("riotplan://step/auth-system?number=3");
```

## Workflow Integration

### With AI Assistants

AI assistants can use RiotPlan to:

1. **Create structured plans** from high-level descriptions
2. **Track progress** across multiple sessions
3. **Execute steps** with clear acceptance criteria
4. **Adapt plans** as requirements evolve
5. **Maintain context** over days or weeks

### Example Session

```
User: "Create a plan for implementing user authentication"

AI: [Uses riotplan_create tool]
→ Creates plan with 8 steps
→ Generates SUMMARY.md, EXECUTION_PLAN.md, and step files

User: "Show me the current status"

AI: [Uses riotplan_status tool]
→ Status: pending
→ Progress: 0% (0/8 steps)
→ Current step: 1

User: "Let's start step 1"

AI: [Uses riotplan_step_start tool]
→ Marks step 1 as in progress
[Reads step content via riotplan://step resource]
→ Executes step tasks
[Uses riotplan_step_complete tool]
→ Marks step 1 as complete

User: "What's next?"

AI: [Uses riotplan_status tool]
→ Progress: 12.5% (1/8 steps)
→ Current step: 2
[Reads step 2 content]
→ Presents next step objectives
```

## AI Provider Configuration

For AI-powered plan generation, set your API key:

```bash
# For Anthropic (recommended)
export ANTHROPIC_API_KEY="sk-ant-..."

# For OpenAI
export OPENAI_API_KEY="sk-..."

# For Google Gemini
export GOOGLE_API_KEY="..."
```

## Benefits of MCP Integration

### For AI Assistants

- **Structured Workflows**: Break complex tasks into manageable steps
- **State Persistence**: Resume work across multiple sessions
- **Progress Tracking**: Always know where you are in a plan
- **Context Maintenance**: Keep track of decisions and blockers
- **Adaptive Planning**: Add/modify steps as requirements emerge

### For Users

- **Transparent Progress**: See exactly what's been done and what's left
- **Reviewable Plans**: Inspect and adjust AI-generated plans
- **Collaborative Work**: Human and AI work together on long-running tasks
- **Version Control Friendly**: All plan files are markdown, easy to track in git

## Troubleshooting

### Server Not Starting

Check that the MCP server is properly installed:

```bash
which riotplan-mcp
# or
npx @riotprompt/riotplan riotplan-mcp --help
```

### Tools Not Available

Verify MCP configuration in Cursor settings and restart the IDE.

### AI Provider Errors

Ensure API keys are set in environment variables and the execution packages are installed:

```bash
npm install -g @riotprompt/execution-anthropic
# or
npm install -g @riotprompt/execution-openai
# or
npm install -g @riotprompt/execution-gemini
```

## Development

To test the MCP server locally:

```bash
# Build the server
npm run mcp:build

# Inspect with MCP inspector
npm run mcp:inspect
```

## License

Apache-2.0
