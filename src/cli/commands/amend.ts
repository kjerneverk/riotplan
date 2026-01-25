import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { resolve, join } from "node:path";
import { stat, readFile } from "node:fs/promises";
import { saveAmendmentPrompt, loadAmendmentPrompts } from "../../plan/prompts.js";

export interface AmendOptions {
    path?: string;
    message?: string;
    step?: string;
}

/**
 * Check if plan exists
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
 * Display current plan state
 */
async function displayPlanState(planPath: string): Promise<void> {
    try {
        const statusPath = join(planPath, "STATUS.md");
        const content = await readFile(statusPath, "utf-8");
        
        // Extract status table
        const statusMatch = content.match(/\*\*Status\*\*\s*\|\s*`(\w+)`/);
        const currentMatch = content.match(/\*\*Current Step\*\*\s*\|\s*([^\n|]+)/);
        
        console.log(chalk.cyan("\n📋 Current Plan State:"));
        console.log(chalk.gray(`   Status: ${statusMatch ? statusMatch[1] : "unknown"}`));
        console.log(chalk.gray(`   Current Step: ${currentMatch ? currentMatch[1].trim() : "-"}`));
        
        // Show previous amendments
        const amendments = await loadAmendmentPrompts(planPath);
        if (amendments.length > 0) {
            console.log(chalk.gray(`\n   Previous amendments: ${amendments.length}`));
            for (const amend of amendments.slice(-3)) {
                const preview = amend.content.slice(0, 50).replace(/\n/g, " ");
                console.log(chalk.gray(`   - #${amend.id}: ${preview}...`));
            }
        }
    } catch {
        console.log(chalk.yellow("Could not load plan state"));
    }
}

/**
 * Prompt for amendment feedback
 */
async function promptForAmendment(): Promise<string> {
    const { feedback } = await inquirer.prompt([
        {
            type: "editor",
            name: "feedback",
            message: "Provide your plan amendment (opens editor):",
        },
    ]);
    return feedback;
}

/**
 * Ask which aspect they want to amend
 */
async function promptForAmendmentType(): Promise<string> {
    const { type } = await inquirer.prompt([
        {
            type: "list",
            name: "type",
            message: "What would you like to amend?",
            choices: [
                { name: "Step organization/ordering", value: "structure" },
                { name: "Specific step content", value: "step" },
                { name: "Add a new step", value: "add" },
                { name: "Remove a step", value: "remove" },
                { name: "Dependencies between steps", value: "dependencies" },
                { name: "General feedback", value: "general" },
            ],
        },
    ]);
    return type;
}

/**
 * Register the amend command
 */
export function registerAmendCommand(program: Command): void {
    program
        .command("amend [path]")
        .description("Provide amendment feedback on a plan")
        .option("-m, --message <message>", "Amendment message (skip editor)")
        .option("-s, --step <number>", "Specific step to amend")
        .action(async (pathArg: string | undefined, options: AmendOptions) => {
            try {
                const planPath = resolve(pathArg || options.path || process.cwd());
                
                // Check if plan exists
                if (!(await planExists(planPath))) {
                    console.error(chalk.red("No plan found at this path."));
                    console.log(chalk.gray("Run 'riotplan generate' first."));
                    process.exit(1);
                }
                
                // Display current state
                await displayPlanState(planPath);
                
                // Get amendment type and feedback
                let feedback: string;
                const metadata: Record<string, unknown> = {};
                
                if (options.message) {
                    feedback = options.message;
                    if (options.step) {
                        metadata.step = options.step;
                        metadata.type = "step";
                    }
                } else {
                    const type = await promptForAmendmentType();
                    metadata.type = type;
                    
                    if (type === "step") {
                        const { stepNum } = await inquirer.prompt([{
                            type: "input",
                            name: "stepNum",
                            message: "Which step number?",
                        }]);
                        metadata.step = stepNum;
                    }
                    
                    feedback = await promptForAmendment();
                }
                
                if (!feedback.trim()) {
                    console.log(chalk.yellow("No feedback provided. Aborting."));
                    return;
                }
                
                // Save amendment
                const savedPath = await saveAmendmentPrompt(planPath, feedback, metadata);
                
                console.log(chalk.green(`\n✅ Amendment saved: ${savedPath}`));
                console.log(chalk.cyan("\nNext steps:"));
                console.log(chalk.gray("  - Continue amending: riotplan amend"));
                console.log(chalk.gray("  - Regenerate plan: riotplan generate --force"));
                console.log(chalk.gray("  - View status: riotplan status"));
                
            } catch (error) {
                console.error(chalk.red("Failed to save amendment:"), error);
                process.exit(1);
            }
        });
}

/**
 * Register amendments list subcommand
 */
export function registerAmendmentsCommands(program: Command): void {
    const amendments = program
        .command("amendments")
        .description("View plan amendments");
    
    amendments
        .command("list [path]")
        .description("List all amendments")
        .action(async (pathArg: string | undefined) => {
            try {
                const planPath = resolve(pathArg || process.cwd());
                const allAmendments = await loadAmendmentPrompts(planPath);
                
                if (allAmendments.length === 0) {
                    console.log(chalk.yellow("No amendments found."));
                    return;
                }
                
                console.log(chalk.cyan(`\n📝 Amendments (${allAmendments.length}):\n`));
                for (const amend of allAmendments) {
                    console.log(chalk.white(`#${amend.id}:`));
                    console.log(chalk.gray(amend.content.slice(0, 200)));
                    console.log();
                }
            } catch (error) {
                console.error(chalk.red("Failed to list amendments:"), error);
                process.exit(1);
            }
        });
}
