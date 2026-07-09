# @planvokter/riotplan-templates

Starter templates for common RiotPlan plan types.

This package ships a small registry of predefined plan skeletons — steps, tasks, and acceptance criteria for recurring kinds of work — plus a function to apply one when creating a new plan. It is a leaf package with no internal dependencies; template application is decoupled from plan creation via a callback, so callers pass in `createPlan` from `@planvokter/riotplan`.

## Installation

```bash
npm install @planvokter/riotplan-templates
```

## Built-in Templates

| Template | Category | Purpose |
|----------|----------|---------|
| `basic` | general | Minimal plan skeleton |
| `feature` | development | Feature implementation |
| `refactoring` | development | Codebase refactoring |
| `migration` | operations | Data/system migration |
| `sprint` | development | Sprint-style batch of work |

## Usage

```typescript
import { listTemplates, getTemplate, applyTemplate } from '@planvokter/riotplan-templates';
import { createPlan } from '@planvokter/riotplan';

// Browse the registry
for (const t of listTemplates()) {
    console.log(t.id, '-', t.description);
}

// Create a plan from a template
const result = await applyTemplate({
    templateId: 'feature',
    code: 'my-feature',
    name: 'My Feature',
    basePath: './plans',
    createPlan,                       // injected — this package never touches storage
    variables: { component: 'api' },  // substituted into template content
});
```

Custom templates can be added at runtime with `registerTemplate()`.

## Ecosystem

Part of the [RiotPlan monorepo](https://github.com/planvokter/riotplan). Used by `@planvokter/riotplan` (CLI) and surfaced through the MCP tools in `@planvokter/riotplan-mcp-http`.

## License

Apache-2.0
