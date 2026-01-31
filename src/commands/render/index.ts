/**
 * @kjerneverk/riotplan-commands-render
 *
 * Render commands for RiotPlan CLI
 */

import { Command } from "commander";
import { renderCommand } from "./render.js";

export { renderCommand } from "./render.js";

/**
 * Register all render commands on a Commander program
 */
export function registerRenderCommands(program: Command): void {
    program.addCommand(renderCommand());
}

