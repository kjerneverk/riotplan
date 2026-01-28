/**
 * @riotprompt/riotplan-commands-plan
 *
 * Plan management commands for RiotPlan CLI
 */

import { Command } from "commander";
import { initCommand } from "./init.js";
import { validateCommand } from "./validate.js";
import { archiveCommand } from "./archive.js";
import { templateCommand } from "./template.js";

export { initCommand } from "./init.js";
export { validateCommand } from "./validate.js";
export { archiveCommand } from "./archive.js";
export {
    templateCommand,
    templateListCommand,
    templateShowCommand,
    templateUseCommand,
} from "./template.js";

/**
 * Register all plan commands on a Commander program
 */
export function registerPlanCommands(program: Command): void {
    const planCmd = program
        .command("plan")
        .description("Plan management commands");

    planCmd.addCommand(initCommand());
    planCmd.addCommand(validateCommand());
    planCmd.addCommand(archiveCommand());
    planCmd.addCommand(templateCommand());
}
