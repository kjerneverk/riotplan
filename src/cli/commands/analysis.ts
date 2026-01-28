import { Command } from "commander";
import chalk from "chalk";
import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hasAnalysis } from "../../analysis/index.js";

/**
 * Register analysis subcommands
 */
export function registerAnalysisCommands(program: Command): void {
    const analysis = program
        .command("analysis")
        .description("Analysis management commands");
    
    analysis
        .command("show [path]")
        .description("Display current analysis")
        .action(async (pathArg: string | undefined) => {
            try {
                const planPath = resolve(pathArg || process.cwd());
                
                if (!(await hasAnalysis(planPath))) {
                    console.error(chalk.red("No analysis found."));
                    process.exit(1);
                }
                
                // Read and display REQUIREMENTS.md
                const reqPath = join(planPath, "analysis", "REQUIREMENTS.md");
                const content = await readFile(reqPath, "utf-8");
                
                console.log(chalk.cyan("\n📋 REQUIREMENTS.md:\n"));
                console.log(content);
                
            } catch (error) {
                console.error(chalk.red("Failed to show analysis:"), error);
                process.exit(1);
            }
        });
    
    analysis
        .command("ready [path]")
        .description("Mark analysis as ready for plan generation")
        .action(async (pathArg: string | undefined) => {
            try {
                const planPath = resolve(pathArg || process.cwd());
                
                if (!(await hasAnalysis(planPath))) {
                    console.error(chalk.red("No analysis found."));
                    process.exit(1);
                }
                
                // Update status in REQUIREMENTS.md
                const reqPath = join(planPath, "analysis", "REQUIREMENTS.md");
                let content = await readFile(reqPath, "utf-8");
                content = content.replace(
                    /\*\*Status\*\*\s*\|\s*`\w+`/,
                    "**Status** | `ready`"
                );
                
                await writeFile(reqPath, content, "utf-8");
                
                console.log(chalk.green("✅ Analysis marked as ready."));
                console.log(chalk.cyan("Run 'riotplan generate' to create the plan."));
                
            } catch (error) {
                console.error(chalk.red("Failed to update analysis:"), error);
                process.exit(1);
            }
        });
}
