/**
 * Tests for Feedback Module
 *
 * The philosophical foundation of RiotPlan: preserving deliberation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    createPlan,
    createFeedback,
    listFeedback,
    getFeedback,
} from "../src/index.js";
import { rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Feedback", () => {
    let testDir: string;
    let planPath: string;

    beforeEach(async () => {
        testDir = join(tmpdir(), `riotplan-feedback-test-${Date.now()}`);
        const result = await createPlan({
            code: "test-plan",
            name: "Test Plan",
            basePath: testDir,
        });
        planPath = result.path;
    });

    afterEach(async () => {
        try {
            await rm(testDir, { recursive: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    describe("createFeedback", () => {
        it("should create a feedback file", async () => {
            const result = await createFeedback(planPath, {
                title: "Initial Review",
                feedback: "Consider adding more steps",
                participants: [
                    { name: "Tim", type: "human" },
                    { name: "Claude", type: "ai", model: "claude-sonnet-4-20250514" },
                ],
                platform: "cursor",
            });

            expect(result.record.id).toBe("001");
            expect(result.record.title).toBe("Initial Review");
            expect(result.record.feedback).toBe("Consider adding more steps");
            expect(result.record.platform).toBe("cursor");
            expect(result.record.participants).toHaveLength(2);
        });

        it("should auto-increment IDs", async () => {
            await createFeedback(planPath, {
                title: "First",
                feedback: "Feedback 1",
            });
            await createFeedback(planPath, {
                title: "Second",
                feedback: "Feedback 2",
            });
            const result = await createFeedback(planPath, {
                title: "Third",
                feedback: "Feedback 3",
            });

            expect(result.record.id).toBe("003");
        });

        it("should slugify titles correctly", async () => {
            const result = await createFeedback(planPath, {
                title: "Initial Architecture Review!",
                feedback: "Test",
            });

            expect(result.record.filename).toBe(
                "001-initial-architecture-review.md"
            );
        });

        it("should generate file with correct content", async () => {
            const result = await createFeedback(planPath, {
                title: "Review",
                feedback: "The approach looks good",
                participants: [{ name: "Dev", type: "human" }],
                platform: "meeting",
                proposed: "Original implementation plan",
                resolution: "Agreed to proceed",
                changes: ["Updated step 2", "Added new step 3"],
            });

            const content = await readFile(result.path, "utf-8");

            expect(content).toContain("# Feedback: Review");
            expect(content).toContain("**Platform**: meeting");
            expect(content).toContain("Dev (human)");
            expect(content).toContain("## What Was Proposed");
            expect(content).toContain("Original implementation plan");
            expect(content).toContain("## Feedback Given");
            expect(content).toContain("The approach looks good");
            expect(content).toContain("## Resolution");
            expect(content).toContain("Agreed to proceed");
            expect(content).toContain("## Changes Made");
            expect(content).toContain("- Updated step 2");
            expect(content).toContain("- Added new step 3");
        });

        it("should include plan version when provided", async () => {
            const result = await createFeedback(planPath, {
                title: "Version Test",
                feedback: "Test",
                planVersion: "0.2",
            });

            const content = await readFile(result.path, "utf-8");
            expect(content).toContain("**Plan Version**: 0.2");
        });

        it("should include context references when provided", async () => {
            const result = await createFeedback(planPath, {
                title: "Context Test",
                feedback: "Test",
                context: [
                    { file: "src/types.ts", startLine: 10, endLine: 20 },
                    { file: "README.md" },
                ],
            });

            const content = await readFile(result.path, "utf-8");
            expect(content).toContain("src/types.ts:10-20");
            expect(content).toContain("README.md");
        });

        it("should include open questions when provided", async () => {
            const result = await createFeedback(planPath, {
                title: "Questions Test",
                feedback: "Test",
                openQuestions: [
                    "How to handle errors?",
                    "What about performance?",
                ],
            });

            const content = await readFile(result.path, "utf-8");
            expect(content).toContain("## Open Questions");
            expect(content).toContain("- How to handle errors?");
            expect(content).toContain("- What about performance?");
        });

        it("should use default values when optional fields not provided", async () => {
            const result = await createFeedback(planPath, {
                title: "Minimal",
                feedback: "Just feedback",
            });

            expect(result.record.platform).toBe("other");
            expect(result.record.participants).toHaveLength(1);
            expect(result.record.participants[0].name).toBe("Unknown");
        });
    });

    describe("listFeedback", () => {
        it("should list all feedback sorted by ID", async () => {
            await createFeedback(planPath, { title: "First", feedback: "F1" });
            await createFeedback(planPath, { title: "Second", feedback: "F2" });
            await createFeedback(planPath, { title: "Third", feedback: "F3" });

            const records = await listFeedback(planPath);

            expect(records.length).toBe(3);
            expect(records[0].id).toBe("001");
            expect(records[1].id).toBe("002");
            expect(records[2].id).toBe("003");
        });

        it("should return empty array for plan without feedback directory", async () => {
            const newPlanResult = await createPlan({
                code: "no-feedback",
                name: "No Feedback",
                basePath: testDir,
                createFeedbackDir: false,
            });

            const records = await listFeedback(newPlanResult.path);
            expect(records).toEqual([]);
        });

        it("should parse feedback content correctly", async () => {
            await createFeedback(planPath, {
                title: "Parsed Test",
                feedback: "This is the feedback content",
                platform: "cursor",
                participants: [{ name: "Tester", type: "human" }],
            });

            const records = await listFeedback(planPath);

            expect(records[0].title).toBe("Parsed Test");
            expect(records[0].platform).toBe("cursor");
            expect(records[0].participants[0].name).toBe("Tester");
        });
    });

    describe("getFeedback", () => {
        it("should get specific feedback by ID", async () => {
            await createFeedback(planPath, {
                title: "First",
                feedback: "First feedback",
            });
            await createFeedback(planPath, {
                title: "Second",
                feedback: "Second feedback",
            });

            const record = await getFeedback(planPath, "002");

            expect(record).not.toBeNull();
            expect(record!.title).toBe("Second");
            expect(record!.id).toBe("002");
        });

        it("should normalize ID without leading zeros", async () => {
            await createFeedback(planPath, {
                title: "Test",
                feedback: "Content",
            });

            const record = await getFeedback(planPath, "1");

            expect(record).not.toBeNull();
            expect(record!.id).toBe("001");
        });

        it("should return null for non-existent ID", async () => {
            await createFeedback(planPath, {
                title: "Test",
                feedback: "Content",
            });

            const record = await getFeedback(planPath, "999");
            expect(record).toBeNull();
        });

        it("should return null for plan without feedback", async () => {
            const newPlanResult = await createPlan({
                code: "no-feedback",
                name: "No Feedback",
                basePath: testDir,
                createFeedbackDir: false,
            });

            const record = await getFeedback(newPlanResult.path, "001");
            expect(record).toBeNull();
        });
    });

    describe("parsing edge cases", () => {
        it("should handle feedback with discussion section", async () => {
            await createFeedback(planPath, {
                title: "With Discussion",
                feedback: "Main feedback",
                discussion: "We discussed this at length...",
            });

            const record = await getFeedback(planPath, "001");

            expect(record!.discussion).toBe("We discussed this at length...");
        });

        it("should parse changes as array", async () => {
            await createFeedback(planPath, {
                title: "With Changes",
                feedback: "Made some changes",
                changes: ["Change 1", "Change 2", "Change 3"],
            });

            const record = await getFeedback(planPath, "001");

            expect(record!.changes).toHaveLength(3);
            expect(record!.changes).toContain("Change 1");
            expect(record!.changes).toContain("Change 2");
            expect(record!.changes).toContain("Change 3");
        });

        it("should parse open questions as array", async () => {
            await createFeedback(planPath, {
                title: "With Questions",
                feedback: "Test",
                openQuestions: ["Question 1?", "Question 2?"],
            });

            const record = await getFeedback(planPath, "001");

            expect(record!.openQuestions).toHaveLength(2);
            expect(record!.openQuestions).toContain("Question 1?");
        });

        it("should handle AI participants with model", async () => {
            await createFeedback(planPath, {
                title: "AI Participant",
                feedback: "Test",
                participants: [
                    { name: "Claude", type: "ai", model: "claude-3-opus" },
                ],
            });

            const record = await getFeedback(planPath, "001");

            expect(record!.participants[0].type).toBe("ai");
            expect(record!.participants[0].model).toBe("claude-3-opus");
        });
    });

    describe("round-trip consistency", () => {
        it("should preserve all fields through create and list", async () => {
            await createFeedback(planPath, {
                title: "Full Feedback",
                feedback: "Complete feedback content",
                participants: [
                    { name: "Human", type: "human" },
                    { name: "AI", type: "ai", model: "test-model" },
                ],
                platform: "cursor",
                proposed: "Original proposal",
                discussion: "Discussion content",
                resolution: "Final resolution",
                changes: ["Change A", "Change B"],
                planVersion: "1.0",
            });

            const records = await listFeedback(planPath);
            const record = records[0];

            expect(record.title).toBe("Full Feedback");
            expect(record.feedback).toBe("Complete feedback content");
            expect(record.platform).toBe("cursor");
            expect(record.proposed).toBe("Original proposal");
            expect(record.discussion).toBe("Discussion content");
            expect(record.resolution).toBe("Final resolution");
            expect(record.changes).toContain("Change A");
            expect(record.planVersion).toBe("1.0");
        });
    });
});

