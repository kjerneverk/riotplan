/**
 * Tests for retrospective generation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Plan } from "../src/types.js";
import {
    generateRetrospective,
    generateRetrospectiveMarkdown,
    createRetrospective,
} from "../src/retrospective/index.js";

// Mock plan for testing
const createMockPlan = (overrides?: Partial<Plan>): Plan => ({
    metadata: {
        code: "test-plan",
        name: "Test Plan",
        path: "/test/plan",
    },
    files: {
        steps: [],
        subdirectories: [],
    },
    steps: [
        {
            number: 1,
            code: "setup",
            filename: "01-setup.md",
            title: "Setup",
            status: "completed",
            filePath: "/test/plan/01-setup.md",
            completedAt: new Date("2026-01-14"),
        },
        {
            number: 2,
            code: "implement",
            filename: "02-implement.md",
            title: "Implementation",
            status: "completed",
            filePath: "/test/plan/02-implement.md",
            completedAt: new Date("2026-01-14"),
        },
        {
            number: 3,
            code: "test",
            filename: "03-test.md",
            title: "Testing",
            status: "skipped",
            filePath: "/test/plan/03-test.md",
        },
    ],
    state: {
        status: "completed",
        progress: 100,
        startedAt: new Date("2026-01-14T09:00:00Z"),
        completedAt: new Date("2026-01-14T17:00:00Z"),
        lastUpdatedAt: new Date("2026-01-14"),
        blockers: [],
        issues: [],
    },
    ...overrides,
});

describe("retrospective", () => {
    describe("generateRetrospective", () => {
        it("should generate retrospective from plan", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);

            expect(retro.planName).toBe("Test Plan");
            expect(retro.planCode).toBe("test-plan");
            expect(retro.totalSteps).toBe(3);
            expect(retro.completedSteps).toBe(2);
            expect(retro.skippedSteps).toBe(1);
        });

        it("should calculate duration", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);

            // 8 hours in milliseconds
            expect(retro.duration).toBe(8 * 60 * 60 * 1000);
        });

        it("should auto-generate what went well", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);

            expect(retro.whatWentWell.length).toBeGreaterThan(0);
            expect(retro.whatWentWell).toContain("No blockers encountered");
        });

        it("should auto-generate what could improve", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);

            // Should note skipped steps
            expect(retro.whatCouldImprove.length).toBeGreaterThan(0);
            expect(retro.whatCouldImprove[0]).toContain("skipped");
        });

        it("should use custom options", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan, {
                whatWentWell: ["Custom success"],
                keyLearnings: ["We learned something"],
                actionItems: ["Do this next"],
            });

            expect(retro.whatWentWell).toEqual(["Custom success"]);
            expect(retro.keyLearnings).toEqual(["We learned something"]);
            expect(retro.actionItems).toEqual(["Do this next"]);
        });

        it("should include steps summary", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);

            expect(retro.stepsSummary.length).toBe(3);
            expect(retro.stepsSummary[0].title).toBe("Setup");
            expect(retro.stepsSummary[0].status).toBe("completed");
        });

        it("should note feedback integration", () => {
            const plan = createMockPlan({
                feedback: [
                    {
                        id: "fb-001",
                        title: "Good feedback",
                        platform: "slack",
                        createdAt: new Date(),
                        participants: [],
                    },
                ],
            });

            const retro = generateRetrospective(plan);

            expect(retro.whatWentWell.some((w) => w.includes("feedback"))).toBe(
                true
            );
        });
    });

    describe("generateRetrospectiveMarkdown", () => {
        it("should generate valid markdown", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);
            const md = generateRetrospectiveMarkdown(retro);

            expect(md).toContain("# Retrospective: Test Plan");
            expect(md).toContain("**Plan Code:** test-plan");
            expect(md).toContain("## Summary");
            expect(md).toContain("## What Went Well");
            expect(md).toContain("## What Could Improve");
            expect(md).toContain("## Key Learnings");
            expect(md).toContain("## Action Items");
            expect(md).toContain("## Steps Summary");
        });

        it("should include summary table", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);
            const md = generateRetrospectiveMarkdown(retro);

            expect(md).toContain("| Total Steps | 3 |");
            expect(md).toContain("| Completed | 2 |");
            expect(md).toContain("| Skipped | 1 |");
        });

        it("should include step status emojis", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan);
            const md = generateRetrospectiveMarkdown(retro);

            expect(md).toContain("✅");
            expect(md).toContain("⏭️");
        });

        it("should show placeholder for empty sections", () => {
            const plan = createMockPlan();
            const retro = generateRetrospective(plan, {
                keyLearnings: [],
                actionItems: [],
            });
            const md = generateRetrospectiveMarkdown(retro);

            expect(md).toContain("*What did you learn?");
            expect(md).toContain("*Any follow-up tasks?");
        });
    });

    describe("createRetrospective", () => {
        let testDir: string;

        beforeEach(async () => {
            testDir = join(tmpdir(), `riotplan-retro-test-${Date.now()}`);
            await mkdir(testDir, { recursive: true });
        });

        afterEach(async () => {
            await rm(testDir, { recursive: true, force: true });
        });

        it("should create RETROSPECTIVE.md file", async () => {
            const plan = createMockPlan({
                metadata: {
                    code: "test-plan",
                    name: "Test Plan",
                    path: testDir,
                },
            });

            const path = await createRetrospective(plan);

            expect(path).toBe(join(testDir, "RETROSPECTIVE.md"));

            const content = await readFile(path, "utf-8");
            expect(content).toContain("# Retrospective: Test Plan");
        });
    });
});

