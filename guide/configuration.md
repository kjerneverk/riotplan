# Configuration Reference

**Purpose**: Detailed guide on configuring `riotplan`.

## Configuration File

RiotPlan looks for a `.riotplanrc.json` file in the plan directory or parent directories.

### Schema

```json
{
  "defaultProvider": "openai",
  "autoUpdateStatus": true,
  "stepTemplate": "detailed",
  "analysis": {
    "enabled": true,
    "directory": "analysis"
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultProvider` | string | `"openai"` | Default LLM provider for execution |
| `autoUpdateStatus` | boolean | `true` | Automatically update STATUS.md on state changes |
| `stepTemplate` | string | `"default"` | Template to use when creating new steps |
| `analysis.enabled` | boolean | `false` | Create analysis/ directory for output |
| `analysis.directory` | string | `"analysis"` | Name of analysis output directory |

## File Naming Conventions

### Plan Code

The plan code is derived from the directory name:
- `my-feature/` → code: `my-feature`
- `big-splitup/` → code: `big-splitup`

### Meta-Prompt

RiotPlan looks for the meta-prompt file in order:
1. `{code}-prompt.md` (e.g., `my-feature-prompt.md`)
2. `prompt-of-prompts.md`

### Step Files

Step files must match the pattern: `/^\d{2}-(.+)\.md$/`

Examples:
- ✅ `01-analysis.md`
- ✅ `02-design-review.md`
- ❌ `1-analysis.md` (missing leading zero)
- ❌ `step-01.md` (wrong format)

Steps are sorted numerically by their prefix.

### Step Subdirectory

If steps are in a subdirectory, use one of:
- `plan/`
- `steps/`

RiotPlan will check both locations.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RIOTPLAN_CONFIG` | Path to custom config file |
| `RIOTPLAN_LOG_LEVEL` | Logging verbosity (debug, info, warn, error) |

## CLI Flags

CLI flags always override configuration file settings:

| Flag | Config Override |
|------|-----------------|
| `--provider <name>` | `defaultProvider` |
| `--no-auto-status` | `autoUpdateStatus: false` |
