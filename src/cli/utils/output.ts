/**
 * Output Utilities
 *
 * Consistent formatting for CLI output.
 */

import chalk from "chalk";
import type { Plan, PlanStep, TaskStatus } from "@riotprompt/riotplan";

/**
 * Output a success message
 */
export function outputSuccess(message: string): void {
    console.log(chalk.green("✓") + " " + message);
}

/**
 * Output an error message
 */
export function outputError(message: string): void {
    console.error(chalk.red("✗") + " " + message);
}

/**
 * Output a warning message
 */
export function outputWarning(message: string): void {
    console.log(chalk.yellow("⚠") + " " + message);
}

/**
 * Output an info message
 */
export function outputInfo(message: string): void {
    console.log(chalk.blue("ℹ") + " " + message);
}

/**
 * Get emoji icon for status
 */
export function getStatusIcon(status: TaskStatus): string {
    const icons: Record<TaskStatus, string> = {
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
 * Format status with color
 */
export function formatStatus(status: TaskStatus): string {
    const colors: Record<TaskStatus, (s: string) => string> = {
        pending: chalk.dim,
        in_progress: chalk.yellow,
        completed: chalk.green,
        failed: chalk.red,
        blocked: chalk.magenta,
        skipped: chalk.gray,
    };
    const color = colors[status] || chalk.white;
    return color(status.replace("_", " "));
}

/**
 * Output a list of steps
 */
export function outputStepList(steps: PlanStep[]): void {
    for (const step of steps) {
        const num = String(step.number).padStart(2, "0");
        const icon = getStatusIcon(step.status);
        const status = formatStatus(step.status);
        console.log(
            `  ${icon} ${chalk.bold(num)} ${step.title} ${chalk.dim(`[${status}]`)}`
        );
    }
}

/**
 * Output a plan summary
 */
export function outputPlanSummary(plan: Plan): void {
    const { metadata, state, steps } = plan;
    const completedCount = steps.filter((s) => s.status === "completed").length;

    console.log();
    console.log(chalk.bold(metadata.name));
    console.log(chalk.dim(`Code: ${metadata.code}`));
    console.log();
    console.log(
        `Status: ${getStatusIcon(state.status)} ${formatStatus(state.status)}`
    );
    console.log(
        `Progress: ${state.progress}% (${completedCount}/${steps.length} steps)`
    );

    if (state.currentStep) {
        const currentStep = steps.find((s) => s.number === state.currentStep);
        if (currentStep) {
            console.log(
                `Current: Step ${state.currentStep} - ${currentStep.title}`
            );
        }
    }

    if (state.blockers.length > 0) {
        console.log();
        console.log(chalk.yellow(`Blockers: ${state.blockers.length}`));
        for (const blocker of state.blockers) {
            console.log(chalk.dim(`  - ${blocker.description}`));
        }
    }
}

/**
 * Output data as JSON
 */
export function outputJson(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
}

