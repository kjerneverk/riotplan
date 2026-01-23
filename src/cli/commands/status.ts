/**
 * Status commands for RiotPlan CLI
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadPlan } from "../../index.js";
import type { Plan, PlanStep } from "../../types.js";

export { showCommand } from "./status-show.js";

/**
 * Get status icon for a given status
 */
export function getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
        pending: "⬜",
        in_progress: "🔄",
        completed: "✅",
        failed: "❌",
        blocked: "⏸️",
        skipped: "⏭️",
    };
    return icons[status] || "⬜";
}

/**
 * Output plan summary
 */
export function outputPlanSummary(plan: Plan): void {
     
    console.log();
     
    console.log(chalk.bold(plan.metadata.name));
     
    console.log(chalk.dim(`Code: ${plan.metadata.code}`));
     
    console.log();
     
    console.log(`Status: ${getStatusIcon(plan.state.status)} ${plan.state.status}`);
    
    if (plan.state.progress !== undefined) {
         
        console.log(`Progress: ${plan.state.progress}%`);
    }
    
    if (plan.state.currentStep) {
         
        console.log(`Current Step: ${plan.state.currentStep}`);
    }
    
    if (plan.state.blockers && plan.state.blockers.length > 0) {
         
        console.log();
         
        console.log(chalk.yellow("Blockers:"));
        for (const blocker of plan.state.blockers) {
             
            console.log(chalk.yellow(`  - ${blocker.description}`));
        }
    }
}

/**
 * Output step list
 */
export function outputStepList(steps: PlanStep[]): void {
    for (const step of steps) {
        const icon = getStatusIcon(step.status);
         
        console.log(`  ${icon} ${String(step.number).padStart(2, "0")}. ${step.title}`);
    }
}

/**
 * Register status commands on the program
 */
export function registerStatusCommands(program: Command): void {
    program
        .command("status")
        .description("Show plan status")
        .argument("[path]", "Path to plan directory", ".")
        .option("-v, --verbose", "Show detailed status with steps")
        .option("--json", "Output as JSON")
        .action(async (path, options) => {
            try {
                const plan = await loadPlan(path);

                if (options.json) {
                     
                    console.log(JSON.stringify({
                        name: plan.metadata.name,
                        code: plan.metadata.code,
                        status: plan.state.status,
                        progress: plan.state.progress,
                        currentStep: plan.state.currentStep,
                        steps: plan.steps.map((s) => ({
                            number: s.number,
                            title: s.title,
                            status: s.status,
                        })),
                        blockers: plan.state.blockers,
                    }, null, 2));
                    return;
                }

                outputPlanSummary(plan);
                
                if (options.verbose) {
                     
                    console.log();
                     
                    console.log("Steps:");
                    outputStepList(plan.steps);
                }
            } catch (error) {
                 
                console.error(chalk.red("✗") + ` Failed to load plan: ${(error as Error).message}`);
                process.exit(1);
            }
        });
}
