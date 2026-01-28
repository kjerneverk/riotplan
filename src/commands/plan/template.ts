/**
 * plan template commands
 */

import { Command } from "commander";
import chalk from "chalk";
import {
    listTemplates,
    getTemplate,
    applyTemplate,
} from "../../templates/index.js";

/**
 * Create the template list command
 */
export function templateListCommand(): Command {
    return new Command("list")
        .description("List available plan templates")
        .option("-c, --category <category>", "Filter by category")
        .action((options) => {
            const templates = listTemplates();

            const filtered = options.category
                ? templates.filter((t) => t.category === options.category)
                : templates;

            if (filtered.length === 0) {
                // eslint-disable-next-line no-console
                console.log(chalk.yellow("No templates found."));
                return;
            }

            // eslint-disable-next-line no-console
            console.log(chalk.bold("\nAvailable Templates:\n"));

            for (const template of filtered) {
                // eslint-disable-next-line no-console
                console.log(chalk.cyan(`  ${template.id}`));
                // eslint-disable-next-line no-console
                console.log(chalk.white(`    ${template.name}`));
                // eslint-disable-next-line no-console
                console.log(chalk.dim(`    ${template.description}`));
                // eslint-disable-next-line no-console
                console.log(
                    chalk.dim(
                        `    Category: ${template.category} | Steps: ${template.steps.length}`
                    )
                );
                // eslint-disable-next-line no-console
                console.log();
            }
        });
}

/**
 * Create the template show command
 */
export function templateShowCommand(): Command {
    return new Command("show")
        .description("Show details of a template")
        .argument("<id>", "Template ID")
        .action((id) => {
            const template = getTemplate(id);

            if (!template) {
                // eslint-disable-next-line no-console
                console.error(chalk.red(`Template not found: ${id}`));
                process.exit(1);
            }

            // eslint-disable-next-line no-console
            console.log();
            // eslint-disable-next-line no-console
            console.log(chalk.bold(template.name));
            // eslint-disable-next-line no-console
            console.log(chalk.dim(`ID: ${template.id}`));
            // eslint-disable-next-line no-console
            console.log();
            // eslint-disable-next-line no-console
            console.log(template.description);
            // eslint-disable-next-line no-console
            console.log();
            // eslint-disable-next-line no-console
            console.log(
                chalk.cyan("Category: ") + template.category
            );
            // eslint-disable-next-line no-console
            console.log(
                chalk.cyan("Tags: ") + template.tags.join(", ")
            );

            // Show phases if defined
            if (template.phases && template.phases.length > 0) {
                // eslint-disable-next-line no-console
                console.log();
                // eslint-disable-next-line no-console
                console.log(chalk.bold("Phases:"));
                for (const phase of template.phases) {
                    // eslint-disable-next-line no-console
                    console.log(chalk.yellow(`  ${phase.name}`));
                    // eslint-disable-next-line no-console
                    console.log(chalk.dim(`    ${phase.description}`));
                }
            }

            // Show steps
            // eslint-disable-next-line no-console
            console.log();
            // eslint-disable-next-line no-console
            console.log(chalk.bold("Steps:"));
            for (let i = 0; i < template.steps.length; i++) {
                const step = template.steps[i];
                const num = String(i + 1).padStart(2, "0");
                // eslint-disable-next-line no-console
                console.log(chalk.white(`  ${num}. ${step.title}`));
                // eslint-disable-next-line no-console
                console.log(chalk.dim(`      ${step.description}`));
            }
            // eslint-disable-next-line no-console
            console.log();
        });
}

/**
 * Create the template use command
 */
export function templateUseCommand(): Command {
    return new Command("use")
        .description("Create a new plan from a template")
        .argument("<template>", "Template ID")
        .argument("<name>", "Plan name/code (lowercase, hyphens)")
        .option("-d, --description <desc>", "Custom description")
        .option("-p, --path <path>", "Base path for plan", ".")
        .action(async (templateId, name, options) => {
            try {
                // Format name into display name
                const displayName = name
                    .split("-")
                    .map(
                        (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ");

                const result = await applyTemplate({
                    templateId,
                    code: name,
                    name: displayName,
                    basePath: options.path,
                    description: options.description,
                });

                if (result.success) {
                    // eslint-disable-next-line no-console
                    console.log(
                        chalk.green("✓") +
                            ` Created plan from template: ${templateId}`
                    );
                    // eslint-disable-next-line no-console
                    console.log(chalk.dim(`Location: ${result.path}`));
                } else {
                    // eslint-disable-next-line no-console
                    console.error(chalk.red("✗") + ` ${result.error}`);
                    process.exit(1);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(
                    chalk.red("✗") +
                        ` Failed to create plan: ${(error as Error).message}`
                );
                process.exit(1);
            }
        });
}

/**
 * Create the template command group
 */
export function templateCommand(): Command {
    const cmd = new Command("template").description(
        "Manage plan templates"
    );

    cmd.addCommand(templateListCommand());
    cmd.addCommand(templateShowCommand());
    cmd.addCommand(templateUseCommand());

    return cmd;
}

