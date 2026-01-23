#!/usr/bin/env node

/**
 * RiotPlan CLI
 *
 * Command-line interface for managing and executing plans.
 * This is a thin shell that imports commands from separate packages.
 *
 * Commands:
 * - riotplan plan init <name>     Create a new plan
 * - riotplan plan validate [path] Validate plan structure
 * - riotplan plan archive [path]  Archive a completed plan
 * - riotplan status [path]        Show current status
 * - riotplan step list [path]     List steps
 * - riotplan step add <title>     Add a step
 * - riotplan step start <n>       Start a step
 * - riotplan step complete <n>    Complete a step
 * - riotplan feedback create      Create feedback record
 * - riotplan feedback list        List feedback records
 */

import { Command } from "commander";
import chalk from "chalk";

// Import command registration functions from command packages
import { registerPlanCommands } from "@riotprompt/riotplan-commands-plan";
import { registerStatusCommands } from "@riotprompt/riotplan-commands-status";
import { registerStepCommands } from "@riotprompt/riotplan-commands-step";
import { registerFeedbackCommands } from "@riotprompt/riotplan-commands-feedback";

const VERSION = "0.0.4";

/**
 * Create the CLI program with all commands
 */
export function createProgram(): Command {
    const program = new Command();

    program
        .name("riotplan")
        .description("Manage long-lived, stateful AI workflows")
        .version(VERSION)
        .configureHelp({
            sortSubcommands: true,
            subcommandTerm: (cmd) => cmd.name(),
        });

    // Register command groups from packages
    registerPlanCommands(program);
    registerStatusCommands(program);
    registerStepCommands(program);
    registerFeedbackCommands(program);

    // Global options
    program
        .option("-v, --verbose", "Verbose output")
        .option("--json", "Output as JSON")
        .option("--no-color", "Disable colored output");

    // Handle unknown commands
    program.on("command:*", () => {
        // eslint-disable-next-line no-console
        console.error(chalk.red(`Unknown command: ${program.args.join(" ")}`));
        // eslint-disable-next-line no-console
        console.log(`Run ${chalk.cyan("riotplan --help")} for usage.`);
        process.exit(1);
    });

    return program;
}

// Main execution - only run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const program = createProgram();
    program.parse();
}
