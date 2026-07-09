# @planvokter/riotplan-cloud

Cloud runtime and Google Cloud Storage sync for RiotPlan.

This package lets a RiotPlan server keep its local plan and context directories mirrored to GCS buckets. It provides a `GcsMirror` for incremental up/down sync (manifest-based diffing, so unchanged files are skipped) and a `createCloudRuntime()` factory that wires sync into a server's request lifecycle with coalescing, debouncing, and freshness TTLs so concurrent requests don't trigger redundant syncs.

Everything is configuration-driven — bucket names, prefixes, project id, and credentials come from config or `RIOTPLAN_*` environment variables. When cloud sync is disabled the runtime is a no-op, which is why the rest of the stack can depend on this package without requiring any cloud setup.

## Installation

```bash
npm install @planvokter/riotplan-cloud
```

## Usage

```typescript
import { createCloudRuntime } from '@planvokter/riotplan-cloud';

const runtime = await createCloudRuntime({
    cloud: {
        enabled: true,
        planBucket: 'my-plan-bucket',
        contextBucket: 'my-context-bucket',
        // projectId / credentials resolved from env if omitted
    },
});

await runtime.syncDown();       // pull latest plans/context before serving
// ... mutate plans locally ...
await runtime.syncUpPlans();    // push changes back
```

Key environment variables: `RIOTPLAN_CLOUD_ENABLED`, `RIOTPLAN_PLAN_BUCKET`, `RIOTPLAN_CONTEXT_BUCKET`, `RIOTPLAN_CLOUD_SYNC_FRESHNESS_TTL_MS`, `RIOTPLAN_CLOUD_SYNC_TIMEOUT_MS`, `RIOTPLAN_CLOUD_CACHE_DIR`.

## What's Here

| Module | Description |
|--------|-------------|
| `gcs-sync` | `GcsMirror`, sync manifests, diff computation, up/down sync stats |
| `runtime` | `createCloudRuntime()`, coalesced/debounced operation helpers |

## Ecosystem

Part of the [RiotPlan monorepo](https://github.com/planvokter/riotplan). Used by `@planvokter/riotplan-mcp-http` to run the HTTP MCP server against cloud-mirrored plan storage. For fully pluggable object storage (rather than GCS-specific sync), see the `@planvokter/riotplan-storage` interfaces.

## License

Apache-2.0
