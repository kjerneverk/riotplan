# @planvokter/riotplan-core

Core domain services for RiotPlan plan lifecycle management.

This package owns the domain logic that operates on plans independent of any
transport layer (HTTP, CLI, etc.). It defines the contracts other packages
program against and provides the default implementations backed by
`@planvokter/riotplan-format` (SQLite).

## Installation

```bash
npm install @planvokter/riotplan-core
```

## What lives here

### Contracts (`src/contracts/`)

TypeScript interfaces that define how the rest of the system interacts with
plan data. Nothing in this layer depends on SQLite, HTTP, or any framework.

- **`PlanStore`** -- read/write interface for plan metadata, files, steps,
  and timeline events.
- **`PlanLifecycleService`** -- stage transitions (idea -> shaping -> built ->
  executing -> done).
- **`PlanStepService`** -- start, complete, add, move, remove steps.
- **`PlanStatusService`** -- read and regenerate plan status summaries.
- **`PlanShapingService`** -- manage approaches and approach selection.

### Services (`src/services/`)

Stateless functions that implement domain operations. Each service works
against the contracts above. Directory-based step operations take their plan
primitives (`loadPlan`, `generateStatus`, step mutations) as injected
dependencies, so this package has no dependency on `@planvokter/riotplan`.

- **lifecycle** -- SQLite stage transitions with timeline logging.
- **steps** -- step start/complete/add/remove/move with STATUS.md
  regeneration (directory plans, via injected deps).
- **status** -- read a status snapshot from a SQLite plan.
- **idea** -- append bullets to IDEA.md sections inside a SQLite plan.
- **build** -- resolve project root for plan generation context.

### Artifacts (`src/artifacts/`)

Generic read/write for typed plan documents (IDEA.md, SHAPING.md, STATUS.md,
etc.) via SQLite `.plan` storage.

### Adapters (`src/adapters/`)

- **`SqlitePlanStore`** -- implements `PlanStore` using
  `@planvokter/riotplan-format`'s SQLite provider.

### Composition (`src/composition.ts`)

`resolveCoreServices()` returns a bag of all service instances, acting as the
dependency-injection root for consumers.

## Dependencies

| Package | Role |
|---|---|
| `@planvokter/riotplan-format` | SQLite provider (`createSqliteProvider`) |

## Ecosystem

Part of the [RiotPlan monorepo](https://github.com/planvokter/riotplan). Sits
in the middle layer of the dependency graph: above `@planvokter/riotplan-format`,
below `@planvokter/riotplan` (CLI) and `@planvokter/riotplan-mcp-http` (HTTP
MCP server), both of which consume these services. The package builds with
plain `tsc`; it is exercised through the `riotplan` and `riotplan-mcp-http`
test suites and does not yet have standalone tests.

## License

Apache-2.0
