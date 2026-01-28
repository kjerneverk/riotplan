/**
 * Feedback commands for RiotPlan CLI
 */

import { Command } from "commander";
import chalk from "chalk";
import { createFeedback, listFeedback, getFeedback } from "../../feedback/index.js";

/**
 * Register feedback commands on the program
 */
export function registerFeedbackCommands(program: Command): void {
    const feedbackCmd = program
        .command("feedback")
        .description("Feedback management commands");

    // Create feedback
    feedbackCmd
        .command("create")
        .description("Create a new feedback record")
        .argument("<title>", "Feedback title")
        .argument("[path]", "Path to plan directory", ".")
        .option("-p, --platform <platform>", "Platform (e.g., github, slack)")
        .option("-f, --feedback <text>", "Feedback content")
        .action(async (title, path, options) => {
            try {
                const result = await createFeedback(path, {
                    title,
                    feedback: options.feedback || "Feedback pending",
                    platform: options.platform,
                    participants: [{ name: "User", type: "human" }],
                });

                 
                console.log(chalk.green("✓") + ` Created feedback: ${result.record.title}`);
                 
                console.log(chalk.dim(`ID: ${result.record.id}`));
            } catch (error) {
                 
                console.error(chalk.red("✗") + ` Failed to create feedback: ${(error as Error).message}`);
                process.exit(1);
            }
        });

    // List feedback
    feedbackCmd
        .command("list")
        .description("List all feedback records")
        .argument("[path]", "Path to plan directory", ".")
        .option("--json", "Output as JSON")
        .action(async (path, options) => {
            try {
                const records = await listFeedback(path);

                if (options.json) {
                     
                    console.log(JSON.stringify(records, null, 2));
                    return;
                }

                if (records.length === 0) {
                     
                    console.log(chalk.dim("No feedback records found."));
                    return;
                }

                 
                console.log();
                 
                console.log(chalk.bold(`Feedback Records (${records.length})`));
                 
                console.log();

                for (const record of records) {
                    const date = record.createdAt.toISOString().split("T")[0];
                     
                    console.log(`  ${chalk.cyan(record.id)} ${record.title} ${chalk.dim(`(${date})`)}`);
                }
                 
                console.log();
            } catch (error) {
                 
                console.error(chalk.red("✗") + ` Failed to list feedback: ${(error as Error).message}`);
                process.exit(1);
            }
        });

    // Show feedback
    feedbackCmd
        .command("show")
        .description("Show a specific feedback record")
        .argument("<id>", "Feedback ID")
        .argument("[path]", "Path to plan directory", ".")
        .option("--json", "Output as JSON")
        .action(async (id, path, options) => {
            try {
                const record = await getFeedback(path, id);

                if (!record) {
                     
                    console.error(chalk.red("✗") + ` Feedback ${id} not found`);
                    process.exit(1);
                }

                if (options.json) {
                     
                    console.log(JSON.stringify(record, null, 2));
                    return;
                }

                 
                console.log();
                 
                console.log(chalk.bold(record.title));
                 
                console.log(chalk.dim(`ID: ${record.id}`));
                 
                console.log(chalk.dim(`Created: ${record.createdAt.toISOString().split("T")[0]}`));

                if (record.platform) {
                     
                    console.log(`Platform: ${record.platform}`);
                }

                if (record.participants && record.participants.length > 0) {
                     
                    console.log();
                     
                    console.log("Participants:");
                    for (const p of record.participants) {
                         
                        console.log(chalk.dim(`  - ${p.name} (${p.type})`));
                    }
                }

                if (record.feedback) {
                     
                    console.log();
                     
                    console.log("Feedback:");
                     
                    console.log(chalk.dim(`  ${record.feedback}`));
                }

                 
                console.log();
            } catch (error) {
                 
                console.error(chalk.red("✗") + ` Failed to show feedback: ${(error as Error).message}`);
                process.exit(1);
            }
        });
}
