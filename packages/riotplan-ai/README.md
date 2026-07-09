# @planvokter/riotplan-ai

AI plan generation engine for RiotPlan.

This package turns a plan's idea/shaping artifacts (constraints, evidence, approaches) into a fully structured plan — summary, execution strategy, and steps — using an LLM. It handles prompt construction, response parsing, token budgeting with evidence tiering, provider detection, validation of the generated plan against its inputs, and provenance reporting.

It builds on `@planvokter/riotplan-format` (SQLite plan storage) and is consumed by `@planvokter/riotplan` (CLI `generate` command) and `@planvokter/riotplan-mcp-http` (server-side generation tools).

## Installation

```bash
npm install @planvokter/riotplan-ai
```

## Usage

```typescript
import { generatePlan, loadProvider, loadArtifacts } from '@planvokter/riotplan-ai';

const provider = await loadProvider({ provider: 'openai' }); // or anthropic, etc.
const artifacts = await loadArtifacts(planProvider);          // idea, shaping, evidence

const result = await generatePlan(provider, artifacts, {
    onProgress: (phase) => console.log(phase),
});

if (result.success) {
    console.log(result.plan.summary);
    console.log(result.plan.steps.length, 'steps generated');
}
```

## What's Here

| Module | Description |
|--------|-------------|
| `generator` | `generatePlan()`, prompt building, response schema and parsing |
| `agent-generator` | `generatePlanWithAgent()` — agentic generation via `@kjerneverk/agentic` |
| `provider-loader` | Detect and load LLM providers from environment/config |
| `artifacts` | Load idea/shaping/evidence/catalyst content from a plan |
| `tokens` | Token estimation, budgets, and evidence tiering |
| `validation` | Post-generation checks (constraint coverage, evidence references, selected approach) |
| `provenance` | Provenance markdown describing what informed the generated plan |
| `tools/` | `createWritePlanTool()` — tool definition for writing generated plans |

## Ecosystem

Part of the [RiotPlan monorepo](https://github.com/planvokter/riotplan). Sits in the middle layer of the dependency graph: above `@planvokter/riotplan-format`, below `@planvokter/riotplan` and `@planvokter/riotplan-mcp-http`.

## License

Apache-2.0
