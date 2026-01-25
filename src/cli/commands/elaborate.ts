import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { resolve } from "node:path";
import { loadAnalysis, hasAnalysis } from "../../analysis/index.js";
import { saveElaborationPrompt } from "../../plan/prompts.js";
import type { Analysis } from "../../analysis/types.js";

export interface ElaborateOptions {
    path?: string;
    message?: string;
}

/**
 * Prompt for elaboration feedback
 */
async function promptForFeedback(): Promise<string> {
    const { feedback } = await inquirer.prompt([
        {
            type: "editor",
            name: "feedback",
            message: "Provide your elaboration feedback (opens editor):",
        },
    ]);
    return feedback;
}

/**
 * Display current analysis state
 */
function displayAnalysisState(analysis: Analysis | null): void {
    if (!analysis) return;
    
    console.log(chalk.cyan("\n📋 Current Analysis State:"));
    console.log(chalk.gray(`   Status: ${analysis.metadata.status}`));
    console.log(chalk.gray(`   Elaborations: ${analysis.metadata.elaborationCount}`));
    
    if (analysis.elaborations.length > 0) {
        console.log(chalk.gray("\n   Previous elaborations:"));
        for (const elab of analysis.elaborations.slice(-3)) {
            const preview = elab.content.slice(0, 50).replace(/\n/g, " ");
            console.log(chalk.gray(`   - #${elab.id}: ${preview}...`));
        }
    }
}

/**
 * Register the elaborate command
 */
export function registerElaborateCommand(program: Command): void {
    program
        .command("elaborate [path]")
        .description("Add elaboration feedback to analysis")
        .option("-m, --message <message>", "Feedback message (skip editor)")
        .action(async (pathArg: string | undefined, options: ElaborateOptions) => {
            try {
                const planPath = resolve(pathArg || options.path || process.cwd());
                
                // Check if analysis exists
                if (!(await hasAnalysis(planPath))) {
                    console.error(chalk.red("No analysis found at this path."));
                    console.log(chalk.gray("Run 'riotplan create --analyze' first."));
                    process.exit(1);
                }
                
                // Load current analysis
                const analysis = await loadAnalysis(planPath);
                displayAnalysisState(analysis);
                
                // Get feedback
                const feedback = options.message || (await promptForFeedback());
                
                if (!feedback.trim()) {
                    console.log(chalk.yellow("No feedback provided. Aborting."));
                    return;
                }
                
                // Save elaboration
                const savedPath = await saveElaborationPrompt(planPath, feedback, {
                    previousCount: analysis?.metadata.elaborationCount || 0,
                });
                
                console.log(chalk.green(`\n✅ Elaboration saved: ${savedPath}`));
                console.log(chalk.cyan("\nNext steps:"));
                console.log(chalk.gray("  - Continue elaborating: riotplan elaborate"));
                console.log(chalk.gray("  - Generate plan: riotplan generate"));
                console.log(chalk.gray("  - View analysis: riotplan analysis show"));
                
            } catch (error) {
                console.error(chalk.red("Failed to save elaboration:"), error);
                process.exit(1);
            }
        });
}
