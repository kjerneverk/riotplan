/**
 * plan validate command
 */

import { Command } from "commander";
import chalk from "chalk";
import { validatePlan } from "../../plan/validator.js";

/**
 * Create the validate command
 */
export function validateCommand(): Command {
    return new Command("validate")
        .description("Validate plan structure")
        .argument("[path]", "Path to plan directory", ".")
        .option("--strict", "Treat warnings as errors")
        .option("--fix", "Attempt to fix issues (not yet implemented)")
        .option("--json", "Output as JSON")
        .action(async (path, options) => {
            try {
                const result = await validatePlan(path, {
                    strict: options.strict,
                });

                if (options.json) {
                    // eslint-disable-next-line no-console
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(result.valid ? 0 : 1);
                }

                // Output info
                for (const info of result.info) {
                    // eslint-disable-next-line no-console
                    console.log(chalk.blue("ℹ") + ` ${info.message}`);
                }

                // Output warnings
                for (const warning of result.warnings) {
                    // eslint-disable-next-line no-console
                    console.log(chalk.yellow("⚠") + ` [${warning.code}] ${warning.message}`);
                }

                // Output errors
                for (const error of result.errors) {
                    // eslint-disable-next-line no-console
                    console.log(chalk.red("✗") + ` [${error.code}] ${error.message}`);
                }

                // Output fixable issues
                if (result.fixable.length > 0 && !options.fix) {
                    // eslint-disable-next-line no-console
                    console.log();
                    // eslint-disable-next-line no-console
                    console.log(
                        chalk.dim(
                            `${result.fixable.length} issue(s) can be auto-fixed with --fix`
                        )
                    );
                }

                // Summary
                // eslint-disable-next-line no-console
                console.log();
                if (result.valid) {
                    // eslint-disable-next-line no-console
                    console.log(chalk.green("✓") + " Plan is valid");
                } else {
                    // eslint-disable-next-line no-console
                    console.log(chalk.red("✗") + " Plan has validation errors");
                    process.exit(1);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(chalk.red("✗") + ` Validation failed: ${(error as Error).message}`);
                process.exit(1);
            }
        });
}
