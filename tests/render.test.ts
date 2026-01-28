import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { registerRenderCommands, renderCommand } from "../src/commands/render/index";
import { renderExportCommand } from "../src/commands/render/render";

// Mock chalk to avoid color codes in tests
vi.mock("chalk", () => ({
    default: {
        green: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        blue: (s: string) => s,
        dim: (s: string) => s,
        bold: (s: string) => s,
    },
}));

// Mock node:fs/promises
vi.mock("node:fs/promises", () => ({
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock the riotplan loader module
const mockLoadPlan = vi.fn();

vi.mock("../src/plan/loader", () => ({
    loadPlan: (...args: unknown[]) => mockLoadPlan(...args),
}));

// Mock the renderer module
const mockRenderPlan = vi.fn();
const mockRenderToMarkdown = vi.fn();
const mockRenderToJson = vi.fn();
const mockRenderToHtml = vi.fn();

vi.mock("../src/renderer/index", () => ({
    renderPlan: (...args: unknown[]) => mockRenderPlan(...args),
    renderToMarkdown: (...args: unknown[]) => mockRenderToMarkdown(...args),
    renderToJson: (...args: unknown[]) => mockRenderToJson(...args),
    renderToHtml: (...args: unknown[]) => mockRenderToHtml(...args),
}));

describe("commands-render", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(process, "exit").mockImplementation((() => {
            throw new Error("process.exit called");
        }) as never);

        // Default mock implementations
        mockLoadPlan.mockResolvedValue({
            metadata: {
                code: "test-plan",
                name: "Test Plan",
                path: "/test/plan",
            },
            files: {
                steps: [],
                subdirectories: [],
            },
            steps: [],
            state: {
                status: "in_progress",
                progress: 50,
                lastUpdatedAt: new Date(),
                blockers: [],
                issues: [],
            },
        });

        mockRenderToMarkdown.mockReturnValue("# Test Plan\n\nMarkdown content");
        mockRenderToJson.mockReturnValue('{"name": "Test Plan"}');
        mockRenderToHtml.mockReturnValue(
            "<!DOCTYPE html><html><body>Test</body></html>"
        );
        mockRenderPlan.mockReturnValue({
            success: true,
            content: "rendered content",
            format: "markdown",
        });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe("registerRenderCommands", () => {
        it("should register render command on program", () => {
            const program = new Command();
            registerRenderCommands(program);

            const renderCmd = program.commands.find(
                (cmd) => cmd.name() === "render"
            );
            expect(renderCmd).toBeDefined();
            expect(renderCmd?.description()).toBe(
                "Render plan to various formats"
            );
        });
    });

    describe("renderCommand", () => {
        it("should create render command with correct options", () => {
            const cmd = renderCommand();

            expect(cmd.name()).toBe("render");
            expect(cmd.description()).toBe("Render plan to various formats");
        });

        it("should have format option", () => {
            const cmd = renderCommand();
            const options = cmd.options.map((o) => o.long);

            expect(options).toContain("--format");
            expect(options).toContain("--output");
            expect(options).toContain("--theme");
        });

        it("should render to markdown by default", async () => {
            const cmd = renderCommand();
            await cmd.parseAsync(["node", "test"]);

            expect(mockLoadPlan).toHaveBeenCalledWith(".");
            expect(mockRenderToMarkdown).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Markdown")
            );
        });

        it("should render to json format", async () => {
            const cmd = renderCommand();
            await cmd.parseAsync(["node", "test", "-f", "json"]);

            expect(mockRenderToJson).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Test Plan")
            );
        });

        it("should render to html format", async () => {
            const cmd = renderCommand();
            await cmd.parseAsync(["node", "test", "-f", "html"]);

            expect(mockRenderToHtml).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("DOCTYPE")
            );
        });

        it("should handle invalid format", async () => {
            const cmd = renderCommand();

            await expect(
                cmd.parseAsync(["node", "test", "-f", "invalid"])
            ).rejects.toThrow("process.exit called");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Invalid format")
            );
        });

        it("should write to output file when specified", async () => {
            const { writeFile } = await import("node:fs/promises");
            const cmd = renderCommand();
            await cmd.parseAsync(["node", "test", "-o", "output.md"]);

            expect(writeFile).toHaveBeenCalledWith(
                "output.md",
                expect.any(String),
                "utf-8"
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Rendered plan to output.md")
            );
        });

        it("should handle load errors", async () => {
            mockLoadPlan.mockRejectedValue(new Error("Plan not found"));
            const cmd = renderCommand();

            await expect(cmd.parseAsync(["node", "test"])).rejects.toThrow(
                "process.exit called"
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Render failed")
            );
        });

        it("should pass options to markdown renderer", async () => {
            const cmd = renderCommand();
            await cmd.parseAsync([
                "node",
                "test",
                "-f",
                "markdown",
                "--task-list",
                "--toc",
            ]);

            expect(mockRenderToMarkdown).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    useTaskList: true,
                    includeToc: true,
                })
            );
        });

        it("should pass theme option to html renderer", async () => {
            const cmd = renderCommand();
            await cmd.parseAsync(["node", "test", "-f", "html", "--theme", "dark"]);

            expect(mockRenderToHtml).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    theme: "dark",
                })
            );
        });
    });

    describe("renderExportCommand", () => {
        it("should create export command with correct options", () => {
            const cmd = renderExportCommand();

            expect(cmd.name()).toBe("export");
            expect(cmd.description()).toBe("Export plan to multiple formats");
        });

        it("should have format options", () => {
            const cmd = renderExportCommand();
            const options = cmd.options.map((o) => o.long);

            expect(options).toContain("--all");
            expect(options).toContain("--markdown");
            expect(options).toContain("--json");
            expect(options).toContain("--html");
            expect(options).toContain("--output-dir");
        });

        it("should export markdown format", async () => {
            const { mkdir, writeFile } = await import("node:fs/promises");
            const cmd = renderExportCommand();
            await cmd.parseAsync(["node", "test", "--markdown"]);

            expect(mockLoadPlan).toHaveBeenCalled();
            expect(mockRenderPlan).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ format: "markdown" })
            );
            expect(mkdir).toHaveBeenCalled();
            expect(writeFile).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Exported")
            );
        });

        it("should export all formats when --all is used", async () => {
            const { writeFile } = await import("node:fs/promises");
            const cmd = renderExportCommand();
            await cmd.parseAsync(["node", "test", "--all"]);

            // Should call renderPlan 3 times (markdown, json, html)
            expect(mockRenderPlan).toHaveBeenCalledTimes(3);
            expect(writeFile).toHaveBeenCalledTimes(3);
        });

        it("should error when no formats specified", async () => {
            const cmd = renderExportCommand();

            await expect(cmd.parseAsync(["node", "test"])).rejects.toThrow(
                "process.exit called"
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("No formats specified")
            );
        });

        it("should handle render failures", async () => {
            mockRenderPlan.mockReturnValue({
                success: false,
                error: "Render failed",
            });
            const cmd = renderExportCommand();
            await cmd.parseAsync(["node", "test", "--markdown"]);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Failed to export")
            );
        });

        it("should handle load errors", async () => {
            mockLoadPlan.mockRejectedValue(new Error("Plan not found"));
            const cmd = renderExportCommand();

            await expect(
                cmd.parseAsync(["node", "test", "--markdown"])
            ).rejects.toThrow("process.exit called");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Export failed")
            );
        });

        it("should use custom output directory", async () => {
            const { mkdir } = await import("node:fs/promises");
            const cmd = renderExportCommand();
            await cmd.parseAsync([
                "node",
                "test",
                "--markdown",
                "-o",
                "./custom-dir",
            ]);

            expect(mkdir).toHaveBeenCalledWith("./custom-dir", {
                recursive: true,
            });
        });
    });
});

