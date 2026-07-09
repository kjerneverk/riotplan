# @planvokter/riotplan-mcp-http

HTTP MCP server for RiotPlan.

This package is the network-facing surface of RiotPlan. It exposes every plan
operation as an MCP tool, resource, or prompt over HTTP using Hono and the
MCP SDK's `StreamableHTTPTransport`. Clients like Cursor, VS Code extensions,
and any MCP-compatible agent connect here.

## Installation

```bash
npm install @planvokter/riotplan-mcp-http
```

Or run the server directly:

```bash
npx @planvokter/riotplan-mcp-http --port 3002 --plans-dir /path/to/plans
```

## What lives here

### Server (`src/server-hono.ts`)

The Hono application that wires up MCP transport, session management, cloud
sync, RBAC authentication, plan download/upload routes, and the `/health`
endpoint. This is the main runtime entry point.

### Tools (`src/tools/`)

Every `riotplan_*` MCP tool definition. Each file exports a tool object with
a name, Zod schema, description, and execute function. Tools cover the full
plan lifecycle:

- **idea** -- create plans, add notes/constraints/questions/evidence/narrative
- **shaping** -- start shaping, add approaches, compare, select
- **build** -- prepare caller-side generation instructions from plan artifacts
- **build-write** -- validate and persist generated plan artifacts and steps
- **step** -- start, complete, add, remove, move steps
- **status** -- read plan status
- **transition** -- move between lifecycle stages
- **history** -- checkpoints and timeline
- **catalyst** -- manage catalyst associations
- **evidence** -- structured evidence writer
- **reflect** -- step reflections
- **retrospective** -- generate plan retrospectives
- **context** -- read plan context for LLM consumption
- **project** -- bind plans to projects, resolve project context
- **switch** -- list plans, switch active plan, rename, delete
- **generate** -- server-side AI plan generation (legacy)
- **validate** -- plan validation

### Resources (`src/resources/`)

MCP resource handlers for read-only access to plan data (plan metadata,
status, steps, individual step content, idea, shaping, evidence, timeline,
checkpoints, artifacts, prompts).

### Prompts (`src/prompts/`)

MCP prompt templates for guided workflows (create plan, explore idea, shape
approach, develop plan, execute step, execute plan, track progress, generate
retrospective).

### Session (`src/session/`)

Session management for multi-connection MCP server operation.

### Other

- **`rbac.ts`** -- role-based access control engine (API key auth, user/role
  lookup, route-level enforcement).
- **`bin-http.ts`** -- CLI entry point for starting the HTTP server.
- **`heartbeat.ts`** -- health/liveness utilities.
- **`types.ts`** -- MCP-specific type definitions (McpTool, ToolResult,
  ToolExecutionContext, resource types, prompt types).
- **`uri.ts`** -- `riotplan://` URI parser.

## Dependencies

This package sits at the **top of the RiotPlan dependency graph** — it pulls
in the whole public stack:

| Package | Role |
|---|---|
| `@planvokter/riotplan` | Plan operations, types, config, status generation, step mutations, plan loader |
| `@planvokter/riotplan-core` | Core service composition (lifecycle, status, idea, build helpers) |
| `@planvokter/riotplan-format` | SQLite provider for direct plan file/step/timeline access |
| `@planvokter/riotplan-ai` | Server-side AI plan generation |
| `@planvokter/riotplan-catalyst` | Catalyst loading and merging for catalyst tools |
| `@planvokter/riotplan-cloud` | Optional GCS mirroring of plan/context directories |
| `@planvokter/riotplan-db` | Abstract token/user repository interfaces (token auth) |
| `@planvokter/riotplan-storage` | Abstract object storage interfaces |

The `riotplan-db` and `riotplan-storage` interfaces have no concrete backend
in this package — deployments implement them for their backend of choice and
inject the implementation (see `src/token-auth.ts`).

## Deployment

The server runs anywhere Node 24+ runs. Generic container and Cloud Run
scaffolding lives in `deploy/` (Dockerfiles, Cloud Build configs, example
env/RBAC files with placeholder values), and `guide/cloud-run.md` walks
through a from-scratch Cloud Run deployment.

## Development

This package is part of the npm-workspaces monorepo — sibling `@planvokter/*`
packages resolve automatically after `npm ci` at the repo root. Build with
`npm run build` (also generates the MCP token report) and test with `npm test`.

## License

Apache-2.0
