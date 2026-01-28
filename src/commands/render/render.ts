/**
 * render command
 */

import { Command } from "commander";
import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import { loadPlan } from "../../plan/loader.js";
import {
    renderPlan,
    renderToMarkdown,
    renderToJson,
    renderToHtml,
    type RenderFormat,
} from "../../renderer/index.js";

/**
 * Create the render command
 */
export function renderCommand(): Command {
    return new Command("render")
        .description("Render plan to various formats")
        .option("-p, --path <path>", "Path to plan directory", ".")
        .option(
            "-f, --format <format>",
            "Output format: markdown, json, html",
            "markdown"
        )
        .option("-o, --output <file>", "Output file (defaults to stdout)")
        .option("--theme <theme>", "HTML theme: light, dark", "light")
        .option("--pretty", "Pretty print JSON output", true)
        .option("--no-metadata", "Exclude metadata from output")
        .option("--feedback", "Include feedback records")
        .option("--evidence", "Include evidence records")
        .option("--task-list", "Use task list format for markdown steps")
        .option("--toc", "Include table of contents (markdown)")
        .option("--no-styles", "Exclude styles from HTML output")
        .option("--full", "Include all details")
        .action(async (options) => {
            try {
                // Load the plan
                const plan = await loadPlan(options.path);

                // Validate format
                const format = options.format.toLowerCase() as RenderFormat;
                if (!["markdown", "json", "html"].includes(format)) {
                    // eslint-disable-next-line no-console
                    console.error(
                        chalk.red("✗") +
                            ` Invalid format: ${options.format}. Use markdown, json, or html.`
                    );
                    process.exit(1);
                }

                // Build render options based on format
                let content: string;

                if (format === "markdown") {
                    content = renderToMarkdown(plan, {
                        includeMetadata: options.metadata !== false,
                        includeStepDetails: true,
                        includeFeedback: options.feedback || options.full,
                        includeEvidence: options.evidence || options.full,
                        useTaskList: options.taskList,
                        includeToc: options.toc,
                    });
                } else if (format === "json") {
                    content = renderToJson(plan, {
                        pretty: options.pretty,
                        includeStepContent: options.full,
                        includeFeedback: options.feedback || options.full,
                        includeEvidence: options.evidence || options.full,
                    });
                } else {
                    content = renderToHtml(plan, {
                        theme: options.theme as "light" | "dark",
                        includeStyles: options.styles !== false,
                        includeStepDetails: true,
                        includeFeedback: options.feedback || options.full,
                        includeEvidence: options.evidence || options.full,
                    });
                }

                // Output
                if (options.output) {
                    await writeFile(options.output, content, "utf-8");
                    // eslint-disable-next-line no-console
                    console.log(
                        chalk.green("✓") +
                            ` Rendered plan to ${options.output}`
                    );
                } else {
                    // eslint-disable-next-line no-console
                    console.log(content);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(
                    chalk.red("✗") +
                        ` Render failed: ${(error as Error).message}`
                );
                process.exit(1);
            }
        });
}

/**
 * Create the render export command (for multiple formats)
 */
export function renderExportCommand(): Command {
    return new Command("export")
        .description("Export plan to multiple formats")
        .option("-p, --path <path>", "Path to plan directory", ".")
        .option("-o, --output-dir <dir>", "Output directory", "./export")
        .option("--all", "Export all formats", false)
        .option("--markdown", "Export markdown", false)
        .option("--json", "Export JSON", false)
        .option("--html", "Export HTML", false)
        .option("--theme <theme>", "HTML theme: light, dark", "light")
        .option("--full", "Include all details")
        .action(async (options) => {
            try {
                // Load the plan
                const plan = await loadPlan(options.path);
                const outputDir = options.outputDir;

                // Determine which formats to export
                const formats: RenderFormat[] = [];
                if (options.all) {
                    formats.push("markdown", "json", "html");
                } else {
                    if (options.markdown) formats.push("markdown");
                    if (options.json) formats.push("json");
                    if (options.html) formats.push("html");
                }

                if (formats.length === 0) {
                    // eslint-disable-next-line no-console
                    console.error(
                        chalk.yellow("!") +
                            " No formats specified. Use --all, --markdown, --json, or --html"
                    );
                    process.exit(1);
                }

                // Create output directory
                const { mkdir } = await import("node:fs/promises");
                await mkdir(outputDir, { recursive: true });

                // Export each format
                for (const format of formats) {
                    const result = renderPlan(plan, {
                        format,
                        theme: options.theme as "light" | "dark",
                        includeStepDetails: true,
                        includeFeedback: options.full,
                        includeEvidence: options.full,
                        pretty: true,
                    });

                    if (result.success && result.content) {
                        const ext =
                            format === "markdown"
                                ? "md"
                                : format === "json"
                                    ? "json"
                                    : "html";
                        const filename = `${plan.metadata.code}.${ext}`;
                        const filepath = `${outputDir}/${filename}`;

                        await writeFile(filepath, result.content, "utf-8");
                        // eslint-disable-next-line no-console
                        console.log(chalk.green("✓") + ` Exported: ${filepath}`);
                    } else {
                        // eslint-disable-next-line no-console
                        console.error(
                            chalk.red("✗") +
                                ` Failed to export ${format}: ${result.error}`
                        );
                    }
                }

                // eslint-disable-next-line no-console
                console.log(
                    chalk.dim(
                        `\nExported ${formats.length} format(s) to ${outputDir}`
                    )
                );
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(
                    chalk.red("✗") +
                        ` Export failed: ${(error as Error).message}`
                );
                process.exit(1);
            }
        });
}

