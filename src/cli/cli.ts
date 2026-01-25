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
import { registerPlanCommands } from "../commands/plan/index.js";
import { registerRenderCommands } from "../commands/render/index.js";
import { registerStatusCommands } from "./commands/status.js";
import { registerStepCommands } from "./commands/step.js";
import { registerFeedbackCommands } from "./commands/feedback.js";
import { registerCreateCommand } from "./commands/create.js";
import { registerElaborateCommand } from "./commands/elaborate.js";
import { registerAnalysisCommands } from "./commands/analysis.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerAmendCommand, registerAmendmentsCommands } from "./commands/amend.js";
import { registerVerifyCommand } from "./commands/verify.js";

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
    registerRenderCommands(program);
    registerStatusCommands(program);
    registerStepCommands(program);
    registerFeedbackCommands(program);
    registerCreateCommand(program);
    registerElaborateCommand(program);
    registerAnalysisCommands(program);
    registerGenerateCommand(program);
    registerAmendCommand(program);
    registerAmendmentsCommands(program);
    registerVerifyCommand(program);

    // Global options
    program
        .option("-v, --verbose", "Verbose output")
        .option("--json", "Output as JSON")
        .option("--no-color", "Disable colored output");

    // Handle unknown commands
    program.on("command:*", () => {
         
        console.error(chalk.red(`Unknown command: ${program.args.join(" ")}`));
         
        console.log(`Run ${chalk.cyan("riotplan --help")} for usage.`);
        process.exit(1);
    });

    return program;
}
