# @planvokter/riotplan-verify

Step verification and coverage checking for RiotPlan.

This package answers the question "is this step actually done?" It parses acceptance criteria out of step markdown, checks artifact existence, and enforces completion rules with configurable strictness. It is a leaf package with no internal dependencies; `@planvokter/riotplan` (the CLI framework) uses it when completing steps.

## Installation

```bash
npm install @planvokter/riotplan-verify
```

## Usage

```typescript
import { VerificationEngine } from '@planvokter/riotplan-verify';

const engine = new VerificationEngine();

const result = await engine.verifyStepCompletion(plan, stepNumber, {
    enforcement: 'strict',          // 'advisory' | 'interactive' | 'strict'
    checkAcceptanceCriteria: true,
    checkArtifacts: true,
});

if (!result.isValid) {
    console.error(result.messages.join('\n'));
}
```

## What's Here

| Module | Description |
|--------|-------------|
| `criteria-parser` | Extract acceptance criteria (checkbox lists) from step markdown |
| `coverage-checker` | Check which criteria are satisfied |
| `completion-checker` | Decide whether a step may be marked complete |
| `engine` | `VerificationEngine` — orchestrates criteria + artifact checks with enforcement levels |
| `errors` | `VerificationError`, `AcceptanceCriteriaError`, `ArtifactVerificationError` |

## Ecosystem

Part of the [RiotPlan monorepo](https://github.com/planvokter/riotplan). Consumed by `@planvokter/riotplan` to gate step completion during plan execution.

## License

Apache-2.0
