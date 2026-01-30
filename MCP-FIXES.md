# MCP Implementation Fixes Needed

## TypeScript Errors to Fix

### 1. Plan.path -> Plan.metadata.path
- Plan type doesn't have `path` property
- Use `plan.metadata.path` instead

### 2. PlanStep.file -> PlanStep.filename
- PlanStep has `filename` not `file`

### 3. PlanState property names
- `lastCompleted` -> `lastCompletedStep`
- `lastUpdated` -> `lastUpdatedAt`

### 4. PlanMetadata property names
- `created` -> `createdAt`

### 5. Blocker[] and Issue[] types
- StatusResource expects `string[]` but Plan has `Blocker[]` and `Issue[]`
- Need to convert to strings or update types

### 6. ValidateOptions
- `fix` property doesn't exist
- Need to check actual API

### 7. CreatePlanResult
- Doesn't have `steps` property
- Check actual return type

### 8. GenerationContext
- Missing `planName` property
- Need to provide it

### 9. MCP Build Externals
- Need to add execution provider packages to externals in build-mcp.js

## Files to Update

1. `src/mcp/resources/plan.ts` - Fix property names
2. `src/mcp/resources/status.ts` - Fix property names and types
3. `src/mcp/resources/step.ts` - Fix property names
4. `src/mcp/resources/steps.ts` - Fix property names
5. `src/mcp/tools/status.ts` - Fix property names
6. `src/mcp/tools/step.ts` - Fix property names
7. `src/mcp/tools/create.ts` - Fix return type handling
8. `src/mcp/tools/generate.ts` - Fix GenerationContext
9. `src/mcp/tools/validate.ts` - Fix options
10. `src/mcp/types.ts` - Update StatusResource type
11. `scripts/build-mcp.js` - Add externals
