/**
 * Error Handling Utilities
 */

import chalk from "chalk";

/**
 * CLI-specific error with code and exit code
 */
export class CliError extends Error {
    constructor(
        message: string,
        public code: string,
        public exitCode: number = 1
    ) {
        super(message);
        this.name = "CliError";
    }
}

/**
 * Handle errors and exit appropriately
 */
export function handleError(error: unknown): never {
    if (error instanceof CliError) {
        console.error(chalk.red(`Error [${error.code}]: ${error.message}`));
        process.exit(error.exitCode);
    }

    if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }

    console.error(chalk.red("An unknown error occurred"));
    process.exit(1);
}

/**
 * Show "not implemented" message for future features
 */
export function notImplemented(feature: string): never {
    console.log(chalk.yellow(`⚠ ${feature} is not yet implemented.`));
    console.log(chalk.dim("Check back in a future version!"));
    process.exit(0);
}

