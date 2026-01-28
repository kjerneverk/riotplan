/**
 * Tests for Plan Creator
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createPlan, loadPlan } from "../src/index.js";
import { rm, access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("createPlan", () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = join(tmpdir(), `riotplan-test-${Date.now()}`);
    });

    afterEach(async () => {
        try {
            await rm(testDir, { recursive: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    describe("basic creation", () => {
        it("should create a valid plan structure", async () => {
            const result = await createPlan({
                code: "test-plan",
                name: "Test Plan",
                basePath: testDir,
                description: "A test plan",
            });

            expect(result.plan.metadata.code).toBe("test-plan");
            expect(result.plan.metadata.name).toBe("Test Plan");
            expect(result.plan.metadata.description).toBe("A test plan");
            expect(result.filesCreated.length).toBeGreaterThan(0);

            // Verify files exist
            for (const file of result.filesCreated) {
                await expect(access(file)).resolves.not.toThrow();
            }
        });

        it("should create SUMMARY.md with correct content", async () => {
            const result = await createPlan({
                code: "summary-test",
                name: "Summary Test Plan",
                basePath: testDir,
                description: "Testing summary generation",
                author: "Test Author",
            });

            const summaryPath = join(result.path, "SUMMARY.md");
            const content = await readFile(summaryPath, "utf-8");

            expect(content).toContain("# Summary Test Plan");
            expect(content).toContain("Testing summary generation");
            expect(content).toContain("*Author: Test Author*");
        });

        it("should create EXECUTION_PLAN.md with steps", async () => {
            const result = await createPlan({
                code: "exec-test",
                name: "Exec Test Plan",
                basePath: testDir,
                steps: [
                    { title: "First Step", description: "Do first thing" },
                    { title: "Second Step", description: "Do second thing" },
                ],
            });

            const execPath = join(result.path, "EXECUTION_PLAN.md");
            const content = await readFile(execPath, "utf-8");

            expect(content).toContain("# Execution Plan: Exec Test Plan");
            expect(content).toContain("| 01 | First Step | Do first thing |");
            expect(content).toContain("| 02 | Second Step | Do second thing |");
        });

        it("should create STATUS.md with step table", async () => {
            const result = await createPlan({
                code: "status-test",
                name: "Status Test Plan",
                basePath: testDir,
                steps: [{ title: "Setup" }, { title: "Build" }],
            });

            const statusPath = join(result.path, "STATUS.md");
            const content = await readFile(statusPath, "utf-8");

            expect(content).toContain("# Status Test Plan Status");
            expect(content).toContain("| 01 | Setup | ⬜ |");
            expect(content).toContain("| 02 | Build | ⬜ |");
            expect(content).toContain("0% (0/2 steps)");
        });
    });

    describe("step creation", () => {
        it("should create custom steps", async () => {
            const result = await createPlan({
                code: "custom-steps",
                name: "Custom Steps Plan",
                basePath: testDir,
                steps: [
                    { title: "First", description: "Do first thing" },
                    { title: "Second", description: "Do second thing" },
                ],
            });

            expect(result.plan.steps.length).toBe(2);
            expect(result.plan.steps[0].title).toBe("First");
            expect(result.plan.steps[0].number).toBe(1);
            expect(result.plan.steps[0].code).toBe("first");
            expect(result.plan.steps[1].title).toBe("Second");
            expect(result.plan.steps[1].number).toBe(2);
        });

        it("should create default steps when none provided", async () => {
            const result = await createPlan({
                code: "default-steps",
                name: "Default Steps Plan",
                basePath: testDir,
            });

            expect(result.plan.steps.length).toBe(3);
            expect(result.plan.steps[0].title).toBe("Setup");
            expect(result.plan.steps[1].title).toBe("Implementation");
            expect(result.plan.steps[2].title).toBe("Testing");
        });

        it("should create step files in plan/ directory", async () => {
            const result = await createPlan({
                code: "step-files",
                name: "Step Files Plan",
                basePath: testDir,
                steps: [{ title: "My Step" }],
            });

            const planDir = join(result.path, "plan");
            const files = await readdir(planDir);

            expect(files).toContain("01-my-step.md");
        });

        it("should generate correct step file content", async () => {
            const result = await createPlan({
                code: "step-content",
                name: "Step Content Plan",
                basePath: testDir,
                steps: [
                    { title: "Setup Database", description: "Configure the DB" },
                ],
            });

            const stepPath = join(result.path, "plan", "01-setup-database.md");
            const content = await readFile(stepPath, "utf-8");

            expect(content).toContain("# Step 01: Setup Database");
            expect(content).toContain("Configure the DB");
        });
    });

    describe("directory creation", () => {
        it("should create feedback directory by default", async () => {
            const result = await createPlan({
                code: "with-feedback",
                name: "Plan With Feedback",
                basePath: testDir,
            });

            const feedbackDir = join(result.path, "feedback");
            await expect(access(feedbackDir)).resolves.not.toThrow();
            expect(result.plan.files.feedbackDir).toBe("feedback");
        });

        it("should create evidence directory by default", async () => {
            const result = await createPlan({
                code: "with-evidence",
                name: "Plan With Evidence",
                basePath: testDir,
            });

            const evidenceDir = join(result.path, "evidence");
            await expect(access(evidenceDir)).resolves.not.toThrow();
            expect(result.plan.files.evidenceDir).toBe("evidence");
        });

        it("should skip feedback directory when createFeedbackDir is false", async () => {
            const result = await createPlan({
                code: "no-feedback",
                name: "Plan Without Feedback",
                basePath: testDir,
                createFeedbackDir: false,
            });

            const feedbackDir = join(result.path, "feedback");
            await expect(access(feedbackDir)).rejects.toThrow();
            expect(result.plan.files.feedbackDir).toBeUndefined();
        });

        it("should skip evidence directory when createEvidenceDir is false", async () => {
            const result = await createPlan({
                code: "no-evidence",
                name: "Plan Without Evidence",
                basePath: testDir,
                createEvidenceDir: false,
            });

            const evidenceDir = join(result.path, "evidence");
            await expect(access(evidenceDir)).rejects.toThrow();
            expect(result.plan.files.evidenceDir).toBeUndefined();
        });
    });

    describe("integration with loadPlan", () => {
        it("should be loadable after creation", async () => {
            const result = await createPlan({
                code: "loadable-plan",
                name: "Loadable Plan",
                basePath: testDir,
                description: "A plan that can be loaded",
            });

            const loaded = await loadPlan(result.path);

            expect(loaded.metadata.code).toBe("loadable-plan");
            expect(loaded.metadata.name).toBe("Loadable Plan");
            expect(loaded.steps.length).toBe(3);
        });

        it("should round-trip custom steps correctly", async () => {
            const result = await createPlan({
                code: "roundtrip-steps",
                name: "Roundtrip Steps Plan",
                basePath: testDir,
                steps: [
                    { title: "Alpha Step", description: "First step" },
                    { title: "Beta Step", description: "Second step" },
                ],
            });

            const loaded = await loadPlan(result.path);

            expect(loaded.steps.length).toBe(2);
            // Title is extracted from file heading which includes step number
            expect(loaded.steps[0].title).toBe("Step 01: Alpha Step");
            expect(loaded.steps[1].title).toBe("Step 02: Beta Step");
            // Code is extracted from filename
            expect(loaded.steps[0].code).toBe("alpha-step");
            expect(loaded.steps[1].code).toBe("beta-step");
        });
    });

    describe("validation", () => {
        it("should reject invalid codes with uppercase", async () => {
            await expect(
                createPlan({
                    code: "Invalid-Code",
                    name: "Test",
                    basePath: testDir,
                })
            ).rejects.toThrow(/Invalid plan code/);
        });

        it("should reject invalid codes with spaces", async () => {
            await expect(
                createPlan({
                    code: "invalid code",
                    name: "Test",
                    basePath: testDir,
                })
            ).rejects.toThrow(/Invalid plan code/);
        });

        it("should reject invalid codes with special characters", async () => {
            await expect(
                createPlan({
                    code: "invalid!code",
                    name: "Test",
                    basePath: testDir,
                })
            ).rejects.toThrow(/Invalid plan code/);
        });

        it("should accept valid codes with numbers and hyphens", async () => {
            const result = await createPlan({
                code: "valid-code-123",
                name: "Valid Code Plan",
                basePath: testDir,
            });

            expect(result.plan.metadata.code).toBe("valid-code-123");
        });
    });

    describe("context assignment", () => {
        it("should assign context when provided", async () => {
            const result = await createPlan({
                code: "with-context",
                name: "Plan With Context",
                basePath: testDir,
                context: "work/kjerneverk",
            });

            expect(result.plan.context).toBe("work/kjerneverk");
        });

        it("should leave context undefined when not provided", async () => {
            const result = await createPlan({
                code: "no-context",
                name: "Plan Without Context",
                basePath: testDir,
            });

            expect(result.plan.context).toBeUndefined();
        });
    });

    describe("result properties", () => {
        it("should return correct path", async () => {
            const result = await createPlan({
                code: "path-test",
                name: "Path Test Plan",
                basePath: testDir,
            });

            expect(result.path).toContain("path-test");
            expect(result.path).toContain(testDir);
        });

        it("should list all created files", async () => {
            const result = await createPlan({
                code: "files-test",
                name: "Files Test Plan",
                basePath: testDir,
                steps: [{ title: "Step 1" }],
            });

            // Should include SUMMARY.md, EXECUTION_PLAN.md, STATUS.md, and step files
            expect(result.filesCreated.length).toBe(4);
            expect(result.filesCreated.some((f) => f.endsWith("SUMMARY.md"))).toBe(true);
            expect(result.filesCreated.some((f) => f.endsWith("STATUS.md"))).toBe(true);
            expect(result.filesCreated.some((f) => f.endsWith("EXECUTION_PLAN.md"))).toBe(true);
            expect(result.filesCreated.some((f) => f.includes("01-step-1.md"))).toBe(true);
        });

        it("should initialize plan state correctly", async () => {
            const result = await createPlan({
                code: "state-test",
                name: "State Test Plan",
                basePath: testDir,
            });

            expect(result.plan.state.status).toBe("pending");
            expect(result.plan.state.progress).toBe(0);
            expect(result.plan.state.blockers).toHaveLength(0);
            expect(result.plan.state.issues).toHaveLength(0);
        });
    });
});

