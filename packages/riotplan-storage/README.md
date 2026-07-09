# @planvokter/riotplan-storage

Abstract interfaces and types for the RiotPlan object storage layer.

This package defines the **contracts** for object storage — the `IStorageProvider` interface and its supporting types — with zero cloud dependencies. Consumers implement the interface for any backend (local filesystem, cloud object storage, etc.) and inject the implementation at deployment time. It is the object-storage counterpart to `@planvokter/riotplan-db` (data access contracts).

## Installation

```bash
npm install @planvokter/riotplan-storage
```

## Usage

```typescript
import type { IStorageProvider, StorageObject } from '@planvokter/riotplan-storage';

class MyStorageProvider implements IStorageProvider {
    async read(path: string): Promise<Buffer> { /* ... */ }
    async write(path: string, content: Buffer | string): Promise<void> { /* ... */ }
    async exists(path: string): Promise<boolean> { /* ... */ }
    async delete(path: string): Promise<void> { /* ... */ }
    async stat(path: string): Promise<StorageObject | null> { /* ... */ }
    async list(prefix?: string): Promise<StorageObject[]> { /* ... */ }
    async signedUrl(path: string, options): Promise<string> { /* ... */ }
}
```

## What's Here

| Module | Description |
|--------|-------------|
| `providers/` | `IStorageProvider` — read/write/exists/delete/stat/list/signedUrl |
| `types/` | `StorageObject` (path, size, timestamps), `StorageWriteOptions`, `StorageSignedUrlOptions` |

## Ecosystem

Part of the [RiotPlan monorepo](https://github.com/planvokter/riotplan). Like `@planvokter/riotplan-db`, this package intentionally contains no concrete backend — it exists so higher layers such as `@planvokter/riotplan-mcp-http` can program against a stable interface while deployments supply their own implementation.

## License

Apache-2.0
