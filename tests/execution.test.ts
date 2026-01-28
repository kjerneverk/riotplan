/**
 * Tests for execution module
 */

import { describe, it, expect, vi } from "vitest";
import type { Plan } from "../src/types.js";
import {
    createExecutor,
    MockStepExecutor,
    executeStep,
    executePendingSteps,
} from "../src/execution/index.js";

// Mock plan for testing
const createMockPlan = (): Plan => ({
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
            code: "step1",
            filename: "01-step1.md",
            title: "Step 1",
            status: "pending",
            filePath: "/test/plan/01-step1.md",
        },
        {
            number: 2,
            code: "step2",
            filename: "02-step2.md",
            title: "Step 2",
            status: "pending",
            filePath: "/test/plan/02-step2.md",
        },
        {
            number: 3,
            code: "step3",
            filename: "03-step3.md",
            title: "Step 3",
            status: "completed",
            filePath: "/test/plan/03-step3.md",
        },
    ],
    state: {
        status: "in_progress",
        progress: 33,
        lastUpdatedAt: new Date(),
        blockers: [],
        issues: [],
    },
});

describe("execution", () => {
    describe("createExecutor", () => {
        it("should create mock executor", () => {
            const executor = createExecutor({ type: "mock" });
            expect(executor).toBeInstanceOf(MockStepExecutor);
        });

        it("should throw for anthropic provider", () => {
            expect(() => createExecutor({ type: "anthropic" })).toThrow(
                "requires @riotprompt/execution-anthropic"
            );
        });

        it("should throw for openai provider", () => {
            expect(() => createExecutor({ type: "openai" })).toThrow(
                "requires @riotprompt/execution-openai"
            );
        });

        it("should throw for gemini provider", () => {
            expect(() => createExecutor({ type: "gemini" })).toThrow(
                "requires @riotprompt/execution-gemini"
            );
        });

        it("should throw for unknown provider", () => {
            expect(() =>
                createExecutor({ type: "unknown" as "mock" })
            ).toThrow("Unknown provider");
        });
    });

    describe("MockStepExecutor", () => {
        it("should execute step successfully", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();

            const result = await executor.execute({
                plan,
                step: plan.steps![0],
                provider: { type: "mock" },
            });

            expect(result.success).toBe(true);
            expect(result.step).toBe(1);
            expect(result.output).toContain("Step 1");
        });

        it("should fail when configured to fail", async () => {
            const executor = new MockStepExecutor({
                delay: 0,
                shouldFail: true,
            });
            const plan = createMockPlan();

            const result = await executor.execute({
                plan,
                step: plan.steps![0],
                provider: { type: "mock" },
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(Error);
            expect(result.error?.message).toContain("Mock execution failed");
        });

        it("should call progress callback", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();
            const onProgress = vi.fn();

            await executor.execute({
                plan,
                step: plan.steps![0],
                provider: { type: "mock" },
                onProgress,
            });

            expect(onProgress).toHaveBeenCalledWith(
                expect.stringContaining("Executing step 1")
            );
        });
    });

    describe("executeStep", () => {
        it("should execute step by number", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();

            const result = await executeStep(executor, plan, 1);

            expect(result.success).toBe(true);
            expect(result.step).toBe(1);
        });

        it("should return error for unknown step", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();

            const result = await executeStep(executor, plan, 99);

            expect(result.success).toBe(false);
            expect(result.error?.message).toContain("not found");
        });

        it("should call onComplete callback", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();
            const onComplete = vi.fn();

            await executeStep(executor, plan, 1, { onComplete });

            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe("executePendingSteps", () => {
        it("should execute all pending steps", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();

            const results = await executePendingSteps(executor, plan);

            // Should execute steps 1 and 2 (pending), not step 3 (completed)
            expect(results.length).toBe(2);
            expect(results[0].step).toBe(1);
            expect(results[1].step).toBe(2);
        });

        it("should stop on error when configured", async () => {
            // Create executor that fails on step 1
            const executor = new MockStepExecutor({
                delay: 0,
                shouldFail: true,
            });
            const plan = createMockPlan();

            const results = await executePendingSteps(executor, plan, {
                stopOnError: true,
            });

            expect(results.length).toBe(1);
            expect(results[0].success).toBe(false);
        });

        it("should continue on error when not configured to stop", async () => {
            const failingExecutor: {
                execute: ReturnType<typeof vi.fn>;
            } = {
                execute: vi.fn(),
            };

            // First call fails, second succeeds
            failingExecutor.execute
                .mockResolvedValueOnce({
                    success: false,
                    step: 1,
                    error: "First failed",
                })
                .mockResolvedValueOnce({
                    success: true,
                    step: 2,
                    output: "Second succeeded",
                });

            const plan = createMockPlan();

            const results = await executePendingSteps(
                failingExecutor as unknown as MockStepExecutor,
                plan,
                { stopOnError: false }
            );

            expect(results.length).toBe(2);
        });

        it("should call progress callbacks", async () => {
            const executor = new MockStepExecutor({ delay: 0 });
            const plan = createMockPlan();
            const onProgress = vi.fn();
            const onStepComplete = vi.fn();

            await executePendingSteps(executor, plan, {
                onProgress,
                onStepComplete,
            });

            expect(onStepComplete).toHaveBeenCalledTimes(2);
        });
    });
});

