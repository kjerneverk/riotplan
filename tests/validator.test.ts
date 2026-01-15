/**
 * Tests for Plan Validation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validatePlan, createPlan } from "../src/index.js";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("validatePlan", () => {
    const fixturesPath = join(__dirname, "fixtures");

    describe("valid plans", () => {
        it("should pass valid plan", async () => {
            const result = await validatePlan(
                join(fixturesPath, "valid-plan")
            );
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it("should include info about loaded plan", async () => {
            const result = await validatePlan(
                join(fixturesPath, "valid-plan")
            );
            expect(
                result.info.some((i) => i.code === "PLAN_LOADED")
            ).toBe(true);
        });
    });

    describe("structure validation", () => {
        it("should detect non-existent directory", async () => {
            const result = await validatePlan("/non/existent/path");
            expect(result.valid).toBe(false);
            expect(
                result.errors.some((e) => e.code === "DIR_NOT_FOUND")
            ).toBe(true);
        });

        it("should warn about missing SUMMARY.md", async () => {
            const result = await validatePlan(
                join(fixturesPath, "empty-plan")
            );
            expect(
                result.warnings.some((w) => w.code === "MISSING_SUMMARY")
            ).toBe(true);
        });

        it("should warn about missing STATUS.md", async () => {
            const result = await validatePlan(
                join(fixturesPath, "empty-plan")
            );
            expect(
                result.warnings.some((w) => w.code === "MISSING_STATUS")
            ).toBe(true);
        });

        it("should warn about missing EXECUTION_PLAN.md", async () => {
            const result = await validatePlan(
                join(fixturesPath, "empty-plan")
            );
            expect(
                result.warnings.some((w) => w.code === "MISSING_EXEC_PLAN")
            ).toBe(true);
        });
    });

    describe("step numbering validation", () => {
        it("should detect step numbering gaps", async () => {
            const result = await validatePlan(
                join(fixturesPath, "plan-with-gaps")
            );
            expect(
                result.warnings.some((w) => w.code === "STEP_GAP")
            ).toBe(true);
        });

        it("should identify fixable gap issues", async () => {
            const result = await validatePlan(
                join(fixturesPath, "plan-with-gaps")
            );
            expect(
                result.fixable.some((f) => f.code === "FIX_STEP_GAP")
            ).toBe(true);
        });
    });

    describe("content validation", () => {
        it("should detect step number mismatch in title", async () => {
            const result = await validatePlan(
                join(fixturesPath, "plan-mismatch")
            );
            expect(
                result.errors.some((e) => e.code === "STEP_NUMBER_MISMATCH")
            ).toBe(true);
        });

        it("should skip content validation when disabled", async () => {
            const result = await validatePlan(
                join(fixturesPath, "plan-mismatch"),
                { validateContent: false }
            );
            expect(
                result.errors.some((e) => e.code === "STEP_NUMBER_MISMATCH")
            ).toBe(false);
        });
    });

    describe("dependency validation", () => {
        let testDir: string;

        beforeEach(async () => {
            testDir = join(tmpdir(), `riotplan-validator-test-${Date.now()}`);
            await mkdir(testDir, { recursive: true });
        });

        afterEach(async () => {
            try {
                await rm(testDir, { recursive: true });
            } catch {
                // Ignore cleanup errors
            }
        });

        it("should detect self-dependency", async () => {
            // Create a plan with self-dependency in the file
            const planPath = join(testDir, "self-dep");
            await mkdir(join(planPath, "plan"), { recursive: true });
            await writeFile(
                join(planPath, "SUMMARY.md"),
                "# Self Dep Plan\n\nTest plan."
            );
            await writeFile(
                join(planPath, "plan", "01-step.md"),
                `# Step 01: Step One

## Objective

Test step.

## Dependencies

- Step 01

## Acceptance Criteria

- [ ] Done
`
            );

            // Validate the plan - should detect self-dependency from file
            const result = await validatePlan(planPath, {
                validateDependencies: true,
            });

            // The loader now parses dependencies from files, so self-dep is detected
            expect(result.valid).toBe(false);
            expect(
                result.errors.some((e) => e.code === "SELF_DEPENDENCY")
            ).toBe(true);
        });

        it("should skip dependency validation when disabled", async () => {
            const result = await validatePlan(
                join(fixturesPath, "valid-plan"),
                { validateDependencies: false }
            );
            expect(result.valid).toBe(true);
        });
    });

    describe("strict mode", () => {
        it("should fail on warnings in strict mode", async () => {
            const result = await validatePlan(
                join(fixturesPath, "empty-plan"),
                { strict: true }
            );
            // Has warnings (missing files) so should be invalid in strict mode
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.valid).toBe(false);
        });

        it("should pass with warnings in non-strict mode", async () => {
            const result = await validatePlan(
                join(fixturesPath, "empty-plan"),
                { strict: false }
            );
            // Has warnings but no errors, so should be valid
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.errors.length).toBe(0);
            expect(result.valid).toBe(true);
        });
    });

    describe("integration with createPlan", () => {
        let testDir: string;

        beforeEach(async () => {
            testDir = join(tmpdir(), `riotplan-validator-test-${Date.now()}`);
        });

        afterEach(async () => {
            try {
                await rm(testDir, { recursive: true });
            } catch {
                // Ignore cleanup errors
            }
        });

        it("should validate newly created plan", async () => {
            const { path } = await createPlan({
                code: "test-plan",
                name: "Test Plan",
                basePath: testDir,
                steps: [
                    { title: "First Step" },
                    { title: "Second Step" },
                ],
            });

            const result = await validatePlan(path);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it("should report step count in info", async () => {
            const { path } = await createPlan({
                code: "test-plan",
                name: "Test Plan",
                basePath: testDir,
                steps: [
                    { title: "Step 1" },
                    { title: "Step 2" },
                    { title: "Step 3" },
                ],
            });

            const result = await validatePlan(path);
            const planInfo = result.info.find((i) => i.code === "PLAN_LOADED");
            expect(planInfo?.message).toContain("3 steps");
        });
    });

    describe("edge cases", () => {
        it("should handle plan with no steps", async () => {
            const result = await validatePlan(
                join(fixturesPath, "plan-no-summary")
            );
            // Should still validate, just with warnings
            expect(result).toBeDefined();
        });

        it("should handle plans with steps in root", async () => {
            const result = await validatePlan(
                join(fixturesPath, "plan-root-steps")
            );
            expect(result.valid).toBe(true);
        });
    });
});

