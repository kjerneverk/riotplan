/**
 * Tests for the Dependencies module
 */

import { describe, it, expect } from "vitest";
import { join } from "node:path";
import {
    parseDependenciesFromContent,
    buildDependencyGraph,
    validateDependencies,
    findCriticalPath,
    computeExecutionOrder,
    getReadySteps,
    getDependencyChain,
} from "../src/dependencies/index.js";
import { loadPlan } from "../src/plan/loader.js";

const FIXTURES_DIR = join(__dirname, "fixtures");

describe("Dependencies Module", () => {
    describe("parseDependenciesFromContent", () => {
        it("should parse dependencies from ## Dependencies section", () => {
            const content = `# Step 03: Test Step

## Dependencies

- Step 01
- Step 02

## Tasks

Do the work.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2]);
        });

        it("should parse dependencies with just numbers", () => {
            const content = `# Step 03: Test Step

## Dependencies

- 1
- 2

## Tasks

Do the work.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2]);
        });

        it("should parse inline dependency references", () => {
            const content = `# Step 03: Test Step

This step (depends on Step 01, 02) builds on previous work.

## Tasks

Do the work.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2]);
        });

        it("should parse Requires: format", () => {
            const content = `# Step 03: Test Step

Requires: Step 01, Step 02

## Tasks

Do the work.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2]);
        });

        it("should parse frontmatter depends-on", () => {
            const content = `---
title: Test Step
depends-on: 1, 2, 3
---

# Step 04: Test Step

## Tasks

Do the work.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2, 3]);
        });

        it("should return empty array when no dependencies", () => {
            const content = `# Step 01: First Step

## Tasks

Do the work.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([]);
        });

        it("should deduplicate dependencies", () => {
            const content = `# Step 03: Test Step

## Dependencies

- Step 01
- Step 01
- Step 02

Also (depends on Step 01) mentioned again.
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2]);
        });

        it("should sort dependencies numerically", () => {
            const content = `# Step 05: Test Step

## Dependencies

- Step 03
- Step 01
- Step 02

## Tasks

Work
`;
            const deps = parseDependenciesFromContent(content);
            expect(deps).toEqual([1, 2, 3]);
        });
    });

    describe("buildDependencyGraph", () => {
        it("should build a correct dependency graph", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            const graph = await buildDependencyGraph(plan);

            // Check roots (steps with no dependencies)
            expect(graph.roots).toEqual([1]);

            // Check leaves (steps with no dependents)
            expect(graph.leaves).toEqual([5]);

            // Check no circular dependencies
            expect(graph.hasCircular).toBe(false);
            expect(graph.circularChains).toEqual([]);

            // Check specific dependencies
            const step1 = graph.dependencies.get(1)!;
            expect(step1.dependsOn).toEqual([]);
            expect(step1.blockedBy).toContain(2);
            expect(step1.blockedBy).toContain(3);

            const step3 = graph.dependencies.get(3)!;
            expect(step3.dependsOn).toEqual([1, 2]);
            expect(step3.blockedBy).toContain(5);

            const step5 = graph.dependencies.get(5)!;
            expect(step5.dependsOn).toEqual([3, 4]);
            expect(step5.blockedBy).toEqual([]);
        });

        it("should detect circular dependencies", async () => {
            const plan = await loadPlan(
                join(FIXTURES_DIR, "plan-circular-deps")
            );

            const graph = await buildDependencyGraph(plan);

            expect(graph.hasCircular).toBe(true);
            expect(graph.circularChains.length).toBeGreaterThan(0);

            // The cycle is 1 -> 3 -> 2 -> 1
            const cycle = graph.circularChains[0];
            expect(cycle).toContain(1);
            expect(cycle).toContain(2);
            expect(cycle).toContain(3);
        });
    });

    describe("validateDependencies", () => {
        it("should pass validation for valid dependencies", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            const result = await validateDependencies(plan);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it("should fail validation for circular dependencies", async () => {
            const plan = await loadPlan(
                join(FIXTURES_DIR, "plan-circular-deps")
            );

            const result = await validateDependencies(plan);

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.type === "circular")).toBe(true);
        });

        it("should detect invalid step references", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            // Manually add an invalid dependency
            const deps = new Map<number, number[]>();
            deps.set(1, []);
            deps.set(2, [1, 99]); // 99 doesn't exist
            deps.set(3, [1, 2]);
            deps.set(4, [2]);
            deps.set(5, [3, 4]);

            const { buildDependencyGraphFromMap } = await import(
                "../src/dependencies/index.js"
            );
            const graph = buildDependencyGraphFromMap(plan, deps);
            // Pass raw deps to validation so it can check for invalid references
            const result = await validateDependencies(plan, graph, deps);

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.type === "invalid-step")).toBe(
                true
            );
        });
    });

    describe("findCriticalPath", () => {
        it("should find the critical path", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            const critical = await findCriticalPath(plan);

            // The critical path should be: 1 -> 2 -> 3 -> 5 (length 4)
            // OR 1 -> 2 -> 4 -> 5 (length 4)
            expect(critical.length).toBe(4);
            expect(critical.path[0]).toBe(1);
            expect(critical.path[critical.path.length - 1]).toBe(5);
        });

        it("should return empty path for circular dependencies", async () => {
            const plan = await loadPlan(
                join(FIXTURES_DIR, "plan-circular-deps")
            );

            const critical = await findCriticalPath(plan);

            expect(critical.path).toEqual([]);
            expect(critical.length).toBe(0);
        });
    });

    describe("computeExecutionOrder", () => {
        it("should compute valid execution order", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            const order = await computeExecutionOrder(plan);

            // Step 1 must come first
            expect(order.order[0]).toBe(1);

            // Step 2 must come before Step 3 and Step 4
            const idx2 = order.order.indexOf(2);
            const idx3 = order.order.indexOf(3);
            const idx4 = order.order.indexOf(4);
            expect(idx2).toBeLessThan(idx3);
            expect(idx2).toBeLessThan(idx4);

            // Step 5 must come last
            expect(order.order[order.order.length - 1]).toBe(5);
        });

        it("should identify parallel execution levels", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            const order = await computeExecutionOrder(plan);

            // Level 0: Step 1
            expect(order.levels[0]).toEqual([1]);

            // Level 1: Step 2
            expect(order.levels[1]).toEqual([2]);

            // Level 2: Steps 3 and 4 (can run in parallel)
            expect(order.levels[2].sort()).toEqual([3, 4]);

            // Level 3: Step 5
            expect(order.levels[3]).toEqual([5]);
        });
    });

    describe("getReadySteps", () => {
        it("should return steps ready to start", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            // Initially only step 1 is ready
            let ready = await getReadySteps(plan);
            expect(ready.map((s) => s.number)).toEqual([1]);

            // After completing step 1, step 2 is ready
            plan.steps[0].status = "completed";
            ready = await getReadySteps(plan);
            expect(ready.map((s) => s.number)).toEqual([2]);

            // After completing step 2, steps 3 and 4 are ready
            plan.steps[1].status = "completed";
            ready = await getReadySteps(plan);
            expect(ready.map((s) => s.number).sort()).toEqual([3, 4]);
        });

        it("should not return in-progress or blocked steps", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            plan.steps[0].status = "completed";
            plan.steps[1].status = "in_progress";

            const ready = await getReadySteps(plan);
            expect(ready.map((s) => s.number)).toEqual([]);
        });
    });

    describe("getDependencyChain", () => {
        it("should return all transitive dependencies", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            // Step 5 depends on 3, 4 which depend on 2 and 1
            const chain = await getDependencyChain(plan, 5);
            expect(chain.sort()).toEqual([1, 2, 3, 4]);
        });

        it("should return empty array for root steps", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            const chain = await getDependencyChain(plan, 1);
            expect(chain).toEqual([]);
        });
    });

    describe("loader integration", () => {
        it("should populate step dependencies when loading", async () => {
            const plan = await loadPlan(join(FIXTURES_DIR, "plan-with-deps"));

            // Step 1 has no dependencies
            expect(plan.steps[0].dependencies).toBeUndefined();

            // Step 2 depends on step 1
            expect(plan.steps[1].dependencies).toEqual([1]);

            // Step 3 depends on steps 1 and 2
            expect(plan.steps[2].dependencies).toEqual([1, 2]);

            // Step 4 depends on step 2
            expect(plan.steps[3].dependencies).toEqual([2]);

            // Step 5 depends on steps 3 and 4
            expect(plan.steps[4].dependencies).toEqual([3, 4]);
        });
    });
});

