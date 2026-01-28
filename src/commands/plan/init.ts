/**
 * plan init command
 */

import { Command } from "commander";
import chalk from "chalk";
import { createPlan } from "../../plan/creator.js";

/**
 * Format a code into a human-readable name
 */
function formatName(code: string): string {
    return code
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * Generate initial steps based on count
 */
function generateInitialSteps(
    count: number
): Array<{ title: string; description?: string }> {
    const defaults = [
        { title: "Setup", description: "Initial setup and prerequisites" },
        { title: "Implementation", description: "Core implementation work" },
        { title: "Testing", description: "Verify everything works" },
        { title: "Documentation", description: "Update documentation" },
        { title: "Release", description: "Final release preparation" },
    ];
    return defaults.slice(0, count);
}

/**
 * Create the init command
 */
export function initCommand(): Command {
    return new Command("init")
        .description("Create a new plan")
        .argument("<name>", "Plan name/code (lowercase, hyphens)")
        .option("-d, --description <desc>", "Plan description")
        .option("-t, --template <template>", "Template to use", "default")
        .option("-p, --path <path>", "Base path for plan", ".")
        .option("--steps <count>", "Number of initial steps", "3")
        .action(async (name, options) => {
            try {
                const result = await createPlan({
                    code: name,
                    name: formatName(name),
                    basePath: options.path,
                    description: options.description,
                    steps: generateInitialSteps(parseInt(options.steps)),
                });

                // eslint-disable-next-line no-console
                console.log(chalk.green("✓") + ` Created plan: ${result.plan.metadata.name}`);
                // eslint-disable-next-line no-console
                console.log(chalk.dim(`Location: ${result.path}`));
                // eslint-disable-next-line no-console
                console.log();
                // eslint-disable-next-line no-console
                console.log("Files created:");
                for (const file of result.filesCreated.slice(0, 5)) {
                    // eslint-disable-next-line no-console
                    console.log(chalk.dim(`  - ${file}`));
                }
                if (result.filesCreated.length > 5) {
                    // eslint-disable-next-line no-console
                    console.log(
                        chalk.dim(
                            `  ... and ${result.filesCreated.length - 5} more`
                        )
                    );
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(chalk.red("✗") + ` Failed to create plan: ${(error as Error).message}`);
                process.exit(1);
            }
        });
}
