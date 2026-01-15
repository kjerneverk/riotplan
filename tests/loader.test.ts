/**
 * Tests for Plan Loader
 */

import { describe, it, expect } from "vitest";
import { loadPlan } from "../src/index.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesPath = join(__dirname, "fixtures");

describe("loadPlan", () => {
    describe("valid plan loading", () => {
        it("should load a valid plan", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"));

            expect(plan.metadata.code).toBe("valid-plan");
            expect(plan.metadata.name).toBe("Valid Test Plan");
            expect(plan.metadata.description).toContain("valid test plan");
        });

        it("should load steps in correct order", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"));

            expect(plan.steps.length).toBe(2);
            expect(plan.steps[0].number).toBe(1);
            expect(plan.steps[0].code).toBe("first-step");
            expect(plan.steps[0].title).toBe("First Step");
            expect(plan.steps[1].number).toBe(2);
            expect(plan.steps[1].code).toBe("second-step");
        });

        it("should discover plan files correctly", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"));

            expect(plan.files.summary).toBe("SUMMARY.md");
            expect(plan.files.status).toBe("STATUS.md");
            expect(plan.files.steps).toHaveLength(2);
            expect(plan.files.subdirectories).toContain("plan");
        });

        it("should parse STATUS.md for step statuses", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"));

            expect(plan.steps[0].status).toBe("completed");
            expect(plan.steps[1].status).toBe("in_progress");
        });

        it("should calculate progress from STATUS.md", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"));

            expect(plan.state.status).toBe("in_progress");
            expect(plan.state.progress).toBe(50); // 1 of 2 steps complete
            expect(plan.state.currentStep).toBe(2);
            expect(plan.state.lastCompletedStep).toBe(1);
        });
    });

    describe("feedback loading", () => {
        it("should load feedback records", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-feedback")
            );

            expect(plan.feedback).toBeDefined();
            expect(plan.feedback!.length).toBe(4);
        });

        it("should use default participant when none defined", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-feedback")
            );

            const noParticipants = plan.feedback!.find(
                (f) => f.id === "003"
            );
            expect(noParticipants).toBeDefined();
            expect(noParticipants?.participants).toHaveLength(1);
            expect(noParticipants?.participants[0].name).toBe("Unknown");
            expect(noParticipants?.participants[0].type).toBe("human");
        });

        it("should use formatted filename when no title in frontmatter", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-feedback")
            );

            const noTitle = plan.feedback!.find(
                (f) => f.id === "004"
            );
            expect(noTitle).toBeDefined();
            expect(noTitle?.title).toBe("No Title");
        });

        it("should parse feedback record details", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-feedback")
            );

            const firstFeedback = plan.feedback![0];
            expect(firstFeedback.id).toBe("001");
            expect(firstFeedback.title).toBe("Initial Review");
            expect(firstFeedback.platform).toBe("cursor");
            expect(firstFeedback.participants.length).toBeGreaterThan(0);
        });

        it("should sort feedback by ID", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-feedback")
            );

            expect(plan.feedback![0].id).toBe("001");
            expect(plan.feedback![1].id).toBe("002");
        });

        it("should skip feedback loading when includeFeedback is false", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-feedback"),
                { includeFeedback: false }
            );

            expect(plan.feedback).toBeUndefined();
        });
    });

    describe("evidence loading", () => {
        it("should load evidence records", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-evidence")
            );

            expect(plan.evidence).toBeDefined();
            expect(plan.evidence!.length).toBe(4);
        });

        it("should detect evidence type from filename", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-evidence")
            );

            const caseStudy = plan.evidence!.find((e) =>
                e.filename.startsWith("what-happened-")
            );
            const research = plan.evidence!.find((e) =>
                e.filename.startsWith("research-")
            );

            expect(caseStudy?.type).toBe("case-study");
            expect(research?.type).toBe("research");
        });

        it("should parse evidence frontmatter", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-evidence")
            );

            const research = plan.evidence!.find((e) =>
                e.filename.startsWith("research-")
            );
            expect(research?.title).toBe("Research on Best Practices");
            expect(research?.summary).toBeDefined();
        });

        it("should handle evidence files without frontmatter", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-evidence")
            );

            const analysis = plan.evidence!.find((e) =>
                e.filename.startsWith("analysis-")
            );
            expect(analysis).toBeDefined();
            expect(analysis?.type).toBe("analysis");
            // Title should come from first heading
            expect(analysis?.title).toBe("Analysis of Architecture");
        });

        it("should fallback to formatted filename for evidence title", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-evidence")
            );

            const example = plan.evidence!.find((e) =>
                e.filename.startsWith("example-")
            );
            expect(example).toBeDefined();
            expect(example?.type).toBe("example");
            // Title should fall back to formatted filename since no title in frontmatter and no heading
            expect(example?.title).toBe("Usage Patterns");
        });

        it("should skip evidence loading when includeEvidence is false", async () => {
            const plan = await loadPlan(
                join(fixturesPath, "plan-with-evidence"),
                { includeEvidence: false }
            );

            expect(plan.evidence).toBeUndefined();
        });
    });

    describe("minimal plan", () => {
        it("should handle plan without steps", async () => {
            const plan = await loadPlan(join(fixturesPath, "minimal-plan"));

            expect(plan.metadata.code).toBe("minimal-plan");
            expect(plan.metadata.name).toBe("Minimal Plan");
            expect(plan.steps.length).toBe(0);
        });

        it("should handle plan without feedback directory", async () => {
            const plan = await loadPlan(join(fixturesPath, "minimal-plan"));

            expect(plan.feedback).toBeUndefined();
        });

        it("should handle plan without evidence directory", async () => {
            const plan = await loadPlan(join(fixturesPath, "minimal-plan"));

            expect(plan.evidence).toBeUndefined();
        });
    });

    describe("edge cases", () => {
        it("should handle plan without SUMMARY.md", async () => {
            const plan = await loadPlan(join(fixturesPath, "plan-no-summary"));

            expect(plan.metadata.code).toBe("plan-no-summary");
            // Name should be formatted from code when no SUMMARY.md
            expect(plan.metadata.name).toBe("Plan No Summary");
            expect(plan.steps.length).toBe(1);
        });

        it("should handle step files in root directory (no plan/ subdir)", async () => {
            const plan = await loadPlan(join(fixturesPath, "plan-root-steps"));

            expect(plan.steps.length).toBe(2);
            expect(plan.steps[0].code).toBe("root-step");
            expect(plan.steps[1].code).toBe("another-step");
        });

        it("should detect meta-prompt file", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"));

            expect(plan.files.metaPrompt).toBe("valid-plan-prompt.md");
        });

        it("should handle empty feedback directory gracefully", async () => {
            // The minimal plan has no feedback directory
            const plan = await loadPlan(join(fixturesPath, "minimal-plan"));
            expect(plan.feedback).toBeUndefined();
        });

        it("should calculate 0% progress for plans with no completed steps", async () => {
            const plan = await loadPlan(join(fixturesPath, "minimal-plan"));
            expect(plan.state.progress).toBe(0);
        });
    });

    describe("error handling", () => {
        it("should throw for non-existent path", async () => {
            await expect(loadPlan("/nonexistent/path")).rejects.toThrow(
                "Plan path does not exist"
            );
        });

        it("should throw for file path (not directory)", async () => {
            await expect(
                loadPlan(join(fixturesPath, "valid-plan/SUMMARY.md"))
            ).rejects.toThrow("Plan path is not a directory");
        });
    });

    describe("options", () => {
        it("should skip status parsing when parseStatus is false", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"), {
                parseStatus: false,
            });

            // All steps should be pending (default)
            for (const step of plan.steps) {
                expect(step.status).toBe("pending");
            }
        });

        it("should support all options together", async () => {
            const plan = await loadPlan(join(fixturesPath, "valid-plan"), {
                includeFeedback: false,
                includeEvidence: false,
                parseStatus: false,
            });

            expect(plan.feedback).toBeUndefined();
            expect(plan.evidence).toBeUndefined();
            expect(plan.steps[0].status).toBe("pending");
        });
    });
});

