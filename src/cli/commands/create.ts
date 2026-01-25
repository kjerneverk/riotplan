import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { join } from "node:path";
import { stat, readFile, writeFile, mkdir } from "node:fs/promises";
import { saveInitialPrompt, saveElaborationPrompt } from "../../plan/prompts.js";
import { createAnalysisDirectory } from "../../analysis/index.js";

export interface CreateOptions {
    direct?: boolean;
    analyze?: boolean;
    path?: string;
}

/**
 * Prompt user for plan name if not provided
 */
async function promptForName(): Promise<string> {
    const { name } = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Plan name (kebab-case):",
            validate: (input: string) => {
                if (!input.trim()) return "Name is required";
                if (!/^[a-z0-9-]+$/.test(input)) {
                    return "Use lowercase letters, numbers, and hyphens only";
                }
                return true;
            },
        },
    ]);
    return name;
}

/**
 * Prompt user for initial plan description
 */
async function promptForDescription(): Promise<string> {
    const { description } = await inquirer.prompt([
        {
            type: "editor",
            name: "description",
            message: "Describe what you want to accomplish (opens editor):",
        },
    ]);
    return description;
}

/**
 * Ask user whether to analyze first or generate directly
 */
async function promptForMode(): Promise<"analyze" | "direct"> {
    const { mode } = await inquirer.prompt([
        {
            type: "list",
            name: "mode",
            message: "How would you like to proceed?",
            choices: [
                {
                    name: "Create an analysis first (recommended for complex plans)",
                    value: "analyze",
                },
                {
                    name: "Generate the plan directly",
                    value: "direct",
                },
            ],
        },
    ]);
    return mode;
}

/**
 * Prompt for elaboration feedback
 */
async function promptForElaboration(): Promise<string> {
    const { feedback } = await inquirer.prompt([{
        type: "editor",
        name: "feedback",
        message: "Enter your elaboration feedback (opens editor):",
    }]);
    return feedback;
}

/**
 * Mark analysis as ready
 */
async function markAnalysisReady(planPath: string): Promise<void> {
    const reqPath = join(planPath, "analysis", "REQUIREMENTS.md");
    let content = await readFile(reqPath, "utf-8");
    content = content.replace(
        /\*\*Status\*\*\s*\|\s*`\w+`/,
        "**Status** | `ready`"
    );
    await writeFile(reqPath, content, "utf-8");
}

/**
 * Check if plan already exists
 */
async function planExists(planPath: string): Promise<boolean> {
    try {
        await stat(join(planPath, "EXECUTION_PLAN.md"));
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate plan files directly
 */
async function generatePlanDirect(
    planPath: string,
    planName: string,
    description: string,
    stepCount: number = 5
): Promise<void> {
    // Create plan directory
    await mkdir(join(planPath, "plan"), { recursive: true });
    
    const title = planName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const today = new Date().toISOString().split("T")[0];
    
    // Generate SUMMARY.md
    const summaryContent = `# ${title} - Summary

## Executive Summary

> Generated from initial prompt. Review and edit as needed.

${description}

## Approach

_Approach to be defined..._

## Success Criteria

_Success criteria to be defined..._
`;
    await writeFile(join(planPath, "SUMMARY.md"), summaryContent, "utf-8");
    console.log(chalk.gray("  Created: SUMMARY.md"));
    
    // Generate EXECUTION_PLAN.md
    const steps = Array.from({ length: stepCount }, (_, i) => {
        const num = String(i + 1).padStart(2, "0");
        return `| ${i + 1} | Step ${num} | \`plan/${num}-step.md\` | - |`;
    }).join("\n");
    
    const execContent = `# ${title} - Execution Plan

> Execute: "${planPath}/EXECUTION_PLAN.md"

## Execution Sequence

| Order | Step | File | Est. Time |
|-------|------|------|-----------|
${steps}

## How to Execute

1. Read STATUS.md for current state
2. Find next pending step
3. Execute step file
4. Update STATUS.md
5. Continue until complete
`;
    await writeFile(join(planPath, "EXECUTION_PLAN.md"), execContent, "utf-8");
    console.log(chalk.gray("  Created: EXECUTION_PLAN.md"));
    
    // Generate STATUS.md
    const statusSteps = Array.from({ length: stepCount }, (_, i) => {
        const num = String(i + 1).padStart(2, "0");
        return `| ${num} | Step ${num} | ⬜ Pending | - | - | - |`;
    }).join("\n");
    
    const statusContent = `# ${title} - Execution Status

## Current State

| Field | Value |
|-------|-------|
| **Status** | \`pending\` |
| **Current Step** | - |
| **Last Completed** | - |
| **Started At** | - |
| **Last Updated** | ${today} |

## Step Progress

| Step | Name | Status | Started | Completed | Notes |
|------|------|--------|---------|-----------|-------|
${statusSteps}

## Blockers

_No blockers currently._

## Issues

_No issues currently._

## Notes

_Plan generated. Ready for review and execution._
`;
    await writeFile(join(planPath, "STATUS.md"), statusContent, "utf-8");
    console.log(chalk.gray("  Created: STATUS.md"));
    
    // Generate step files
    for (let i = 1; i <= stepCount; i++) {
        const num = String(i).padStart(2, "0");
        const stepContent = `# Step ${num}: [Title]

## Objective

_Define the objective of this step..._

## Background

_Provide context..._

## Tasks

### ${num}.1 Task One

_Describe the task..._

## Acceptance Criteria

- [ ] Criterion one
- [ ] Criterion two

## Testing

_How to verify this step is complete..._

## Files Changed

- _List files that will be modified..._

## Notes

_Additional notes..._
`;
        await writeFile(join(planPath, "plan", `${num}-step.md`), stepContent, "utf-8");
        console.log(chalk.gray(`  Created: plan/${num}-step.md`));
    }
}

/**
 * Register the create command
 */
export function registerCreateCommand(program: Command): void {
    program
        .command("create [name]")
        .description("Interactively create a new plan")
        .option("-d, --direct", "Skip analysis, generate plan directly")
        .option("-a, --analyze", "Force analysis phase")
        .option("-p, --path <path>", "Output directory (default: current)")
        .option("-s, --steps <number>", "Number of steps to generate", "5")
        .action(async (name: string | undefined, options: CreateOptions & { steps?: string }) => {
            try {
                // Get name if not provided
                const planName = name || (await promptForName());
                
                // Get description
                console.log(chalk.cyan("\nDescribe your plan:"));
                const description = await promptForDescription();
                
                // Determine mode
                let mode: "analyze" | "direct";
                if (options.direct) {
                    mode = "direct";
                } else if (options.analyze) {
                    mode = "analyze";
                } else {
                    mode = await promptForMode();
                }
                
                // Output path
                const basePath = options.path || process.cwd();
                const planPath = join(basePath, planName);
                const stepCount = parseInt(options.steps || "5", 10);
                
                console.log(chalk.green(`\nCreating plan: ${planName}`));
                console.log(chalk.gray(`Path: ${planPath}`));
                console.log(chalk.gray(`Mode: ${mode}`));
                
                // Save the initial prompt
                const promptPath = await saveInitialPrompt(planPath, planName, description);
                console.log(chalk.gray(`Prompt saved: ${promptPath}`));
                
                if (mode === "analyze") {
                    // Create analysis directory structure
                    const analysisPath = await createAnalysisDirectory({
                        planPath,
                        planName,
                        initialPrompt: description,
                    });
                    console.log(chalk.green(`\n✅ Analysis created: ${analysisPath}`));
                    
                    // Ask if they want to elaborate now
                    const { elaborateNow } = await inquirer.prompt([{
                        type: "confirm",
                        name: "elaborateNow",
                        message: "Would you like to add elaboration feedback now?",
                        default: true,
                    }]);
                    
                    if (elaborateNow) {
                        let continueElaborating = true;
                        while (continueElaborating) {
                            const feedback = await promptForElaboration();
                            if (feedback.trim()) {
                                await saveElaborationPrompt(planPath, feedback);
                                console.log(chalk.green("✅ Elaboration saved."));
                            }
                            
                            const { more } = await inquirer.prompt([{
                                type: "confirm",
                                name: "more",
                                message: "Add more elaboration?",
                                default: false,
                            }]);
                            continueElaborating = more;
                        }
                    }
                    
                    // Ask if ready to generate
                    const { generateNow } = await inquirer.prompt([{
                        type: "confirm",
                        name: "generateNow",
                        message: "Ready to generate plan from analysis?",
                        default: false,
                    }]);
                    
                    if (generateNow) {
                        await markAnalysisReady(planPath);
                        console.log(chalk.cyan("\nGenerating plan..."));
                        await generatePlanDirect(planPath, planName, description, stepCount);
                        console.log(chalk.green("\n✅ Plan generated!"));
                    } else {
                        console.log(chalk.cyan("\nWhen ready:"));
                        console.log(chalk.gray("  - Add more: riotplan elaborate"));
                        console.log(chalk.gray("  - Generate: riotplan analysis ready && riotplan generate"));
                    }
                } else {
                    // Direct mode - generate immediately
                    console.log(chalk.cyan("\nGenerating plan..."));
                    await generatePlanDirect(planPath, planName, description, stepCount);
                    console.log(chalk.green("\n✅ Plan generated!"));
                }
                
                // Show completion message
                if (await planExists(planPath)) {
                    console.log(chalk.green("\n🎉 Plan creation complete!"));
                    console.log(chalk.cyan("\nNext steps:"));
                    console.log(chalk.gray(`  cd ${planPath}`));
                    console.log(chalk.gray("  riotplan status"));
                    console.log(chalk.gray("  riotplan step start 01"));
                }
                
            } catch (error) {
                console.error(chalk.red("Failed to create plan:"), error);
                process.exit(1);
            }
        });
}
