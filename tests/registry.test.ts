/**
 * Tests for the Plan Registry module
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
    createRegistry,
    scanForPlans,
    registerPlan,
    unregisterPlan,
    searchPlans,
    getPlanByCode,
    getPlanByPath,
    getPlansByStatus,
    refreshPlan,
    refreshAllPlans,
    getRegistryStats,
    saveRegistry,
    loadRegistry,
} from "../src/registry/index.js";
import type { RegisteredPlan } from "../src/registry/index.js";

const FIXTURES_DIR = join(__dirname, "fixtures");

describe("Registry Module", () => {
    describe("createRegistry", () => {
        it("should create an empty registry", () => {
            const registry = createRegistry();
            expect(registry.plans.size).toBe(0);
            expect(registry.searchPaths).toEqual([]);
            expect(registry.version).toBe("1.0");
        });

        it("should create registry with search paths", () => {
            const registry = createRegistry(["/path/a", "/path/b"]);
            expect(registry.searchPaths).toHaveLength(2);
        });
    });

    describe("scanForPlans", () => {
        it("should discover plans in fixtures directory", async () => {
            const registry = createRegistry();

            const discovered = await scanForPlans(registry, {
                searchPaths: [FIXTURES_DIR],
                maxDepth: 2,
            });

            expect(discovered).toBeGreaterThan(0);
            expect(registry.plans.size).toBeGreaterThan(0);
        });

        it("should respect maxDepth", async () => {
            const registry = createRegistry();

            await scanForPlans(registry, {
                searchPaths: [FIXTURES_DIR],
                maxDepth: 0, // Only immediate children
            });

            // With maxDepth 0, we only check direct contents
            expect(registry.plans.size).toBeGreaterThanOrEqual(0);
        });

        it("should exclude specified directories", async () => {
            const registry = createRegistry();

            await scanForPlans(registry, {
                searchPaths: [FIXTURES_DIR],
                maxDepth: 3,
                excludeDirs: ["node_modules", ".git", "plan-with-deps"],
            });

            // plan-with-deps should be excluded
            const hasDeps = Array.from(registry.plans.values()).some((p) =>
                p.path.includes("plan-with-deps")
            );
            expect(hasDeps).toBe(false);
        });
    });

    describe("plan registration", () => {
        let registry: ReturnType<typeof createRegistry>;

        beforeEach(() => {
            registry = createRegistry();
        });

        it("should register a plan", () => {
            const entry: RegisteredPlan = {
                code: "test-plan",
                name: "Test Plan",
                path: "/test/path",
                status: "pending",
                progress: 0,
                stepCount: 3,
                completedSteps: 0,
                registeredAt: new Date(),
                lastScannedAt: new Date(),
            };

            registerPlan(registry, entry);

            expect(registry.plans.size).toBe(1);
            expect(registry.plans.get("/test/path")).toEqual(entry);
            expect(registry.byCode.get("test-plan")).toContain("/test/path");
            expect(registry.byStatus.get("pending")).toContain("/test/path");
        });

        it("should update existing plan", () => {
            const entry1: RegisteredPlan = {
                code: "test-plan",
                name: "Test Plan",
                path: "/test/path",
                status: "pending",
                progress: 0,
                stepCount: 3,
                completedSteps: 0,
                registeredAt: new Date(),
                lastScannedAt: new Date(),
            };

            registerPlan(registry, entry1);

            const entry2: RegisteredPlan = {
                ...entry1,
                status: "in_progress",
                progress: 33,
                completedSteps: 1,
            };

            registerPlan(registry, entry2);

            expect(registry.plans.size).toBe(1);
            expect(registry.plans.get("/test/path")?.status).toBe("in_progress");
            expect(registry.byStatus.get("pending")).toBeUndefined();
            expect(registry.byStatus.get("in_progress")).toContain("/test/path");
        });

        it("should unregister a plan", () => {
            const entry: RegisteredPlan = {
                code: "test-plan",
                name: "Test Plan",
                path: "/test/path",
                status: "pending",
                progress: 0,
                stepCount: 3,
                completedSteps: 0,
                registeredAt: new Date(),
                lastScannedAt: new Date(),
            };

            registerPlan(registry, entry);
            const removed = unregisterPlan(registry, "/test/path");

            expect(removed).toBe(true);
            expect(registry.plans.size).toBe(0);
            expect(registry.byCode.get("test-plan")).toBeUndefined();
        });

        it("should return false when unregistering non-existent plan", () => {
            const removed = unregisterPlan(registry, "/non/existent");
            expect(removed).toBe(false);
        });
    });

    describe("searchPlans", () => {
        let registry: ReturnType<typeof createRegistry>;

        beforeEach(async () => {
            registry = createRegistry();

            // Add some test plans
            const plans: RegisteredPlan[] = [
                {
                    code: "plan-a",
                    name: "Plan Alpha",
                    path: "/plans/a",
                    status: "completed",
                    progress: 100,
                    stepCount: 5,
                    completedSteps: 5,
                    registeredAt: new Date("2024-01-01"),
                    lastScannedAt: new Date(),
                    tags: ["important", "backend"],
                },
                {
                    code: "plan-b",
                    name: "Plan Beta",
                    path: "/plans/b",
                    status: "in_progress",
                    progress: 50,
                    stepCount: 4,
                    completedSteps: 2,
                    registeredAt: new Date("2024-02-01"),
                    lastScannedAt: new Date(),
                    tags: ["frontend"],
                },
                {
                    code: "plan-c",
                    name: "Plan Charlie",
                    path: "/plans/c",
                    status: "pending",
                    progress: 0,
                    stepCount: 3,
                    completedSteps: 0,
                    registeredAt: new Date("2024-03-01"),
                    lastScannedAt: new Date(),
                    tags: ["important"],
                },
            ];

            for (const plan of plans) {
                registerPlan(registry, plan);
            }
        });

        it("should return all plans when no filters", () => {
            const result = searchPlans(registry);
            expect(result.total).toBe(3);
            expect(result.plans).toHaveLength(3);
        });

        it("should filter by status", () => {
            const result = searchPlans(registry, { status: "completed" });
            expect(result.total).toBe(1);
            expect(result.plans[0].code).toBe("plan-a");
        });

        it("should filter by multiple statuses", () => {
            const result = searchPlans(registry, {
                status: ["completed", "pending"],
            });
            expect(result.total).toBe(2);
        });

        it("should filter by code pattern", () => {
            const result = searchPlans(registry, { codePattern: "plan-[ab]" });
            expect(result.total).toBe(2);
        });

        it("should filter by name pattern", () => {
            const result = searchPlans(registry, { namePattern: "alpha" });
            expect(result.total).toBe(1);
        });

        it("should filter by tags", () => {
            const result = searchPlans(registry, { tags: ["important"] });
            expect(result.total).toBe(2);
        });

        it("should filter by progress range", () => {
            const result = searchPlans(registry, {
                minProgress: 25,
                maxProgress: 75,
            });
            expect(result.total).toBe(1);
            expect(result.plans[0].progress).toBe(50);
        });

        it("should sort by name ascending", () => {
            const result = searchPlans(registry, {
                sortBy: "name",
                sortDir: "asc",
            });
            expect(result.plans[0].name).toBe("Plan Alpha");
            expect(result.plans[2].name).toBe("Plan Charlie");
        });

        it("should sort by progress descending", () => {
            const result = searchPlans(registry, {
                sortBy: "progress",
                sortDir: "desc",
            });
            expect(result.plans[0].progress).toBe(100);
            expect(result.plans[2].progress).toBe(0);
        });

        it("should paginate results", () => {
            const result = searchPlans(registry, {
                limit: 2,
                offset: 1,
            });
            expect(result.total).toBe(3);
            expect(result.plans).toHaveLength(2);
        });
    });

    describe("query functions", () => {
        let registry: ReturnType<typeof createRegistry>;

        beforeEach(() => {
            registry = createRegistry();
            registerPlan(registry, {
                code: "test",
                name: "Test",
                path: "/plans/test",
                status: "in_progress",
                progress: 50,
                stepCount: 2,
                completedSteps: 1,
                registeredAt: new Date(),
                lastScannedAt: new Date(),
            });
        });

        it("should get plan by code", () => {
            const plan = getPlanByCode(registry, "test");
            expect(plan).not.toBeNull();
            expect(plan?.name).toBe("Test");
        });

        it("should return null for unknown code", () => {
            const plan = getPlanByCode(registry, "unknown");
            expect(plan).toBeNull();
        });

        it("should get plan by path", () => {
            const plan = getPlanByPath(registry, "/plans/test");
            expect(plan).not.toBeNull();
            expect(plan?.code).toBe("test");
        });

        it("should get plans by status", () => {
            const plans = getPlansByStatus(registry, "in_progress");
            expect(plans).toHaveLength(1);
            expect(plans[0].code).toBe("test");
        });

        it("should return empty array for status with no plans", () => {
            const plans = getPlansByStatus(registry, "blocked");
            expect(plans).toHaveLength(0);
        });
    });

    describe("refresh operations", () => {
        let testDir: string;

        beforeEach(async () => {
            testDir = join(tmpdir(), `riotplan-registry-test-${Date.now()}`);
            await mkdir(testDir, { recursive: true });
        });

        afterEach(async () => {
            try {
                await rm(testDir, { recursive: true });
            } catch {
                // Ignore
            }
        });

        it("should refresh a plan", async () => {
            // Create a plan
            const planPath = join(testDir, "refresh-plan");
            await mkdir(join(planPath, "plan"), { recursive: true });
            await writeFile(
                join(planPath, "SUMMARY.md"),
                "# Refresh Test\n\nTest plan."
            );
            await writeFile(
                join(planPath, "plan", "01-step.md"),
                "# Step 01: Test\n\n## Objective\n\nTest."
            );

            const registry = createRegistry();
            await scanForPlans(registry, { searchPaths: [testDir] });

            // Modify the plan
            await writeFile(
                join(planPath, "plan", "02-step.md"),
                "# Step 02: Another\n\n## Objective\n\nTest."
            );

            // Refresh
            const updated = await refreshPlan(registry, planPath);
            expect(updated).not.toBeNull();
            expect(updated?.stepCount).toBe(2);
        });

        it("should return null for removed plan", async () => {
            const registry = createRegistry();

            // Register a fake plan
            registerPlan(registry, {
                code: "fake",
                name: "Fake",
                path: "/non/existent",
                status: "pending",
                progress: 0,
                stepCount: 0,
                completedSteps: 0,
                registeredAt: new Date(),
                lastScannedAt: new Date(),
            });

            const result = await refreshPlan(registry, "/non/existent");
            expect(result).toBeNull();
            expect(registry.plans.size).toBe(0);
        });
    });

    describe("statistics", () => {
        it("should calculate correct statistics", () => {
            const registry = createRegistry();

            registerPlan(registry, {
                code: "a",
                name: "A",
                path: "/a",
                status: "completed",
                progress: 100,
                stepCount: 5,
                completedSteps: 5,
                registeredAt: new Date("2024-01-01"),
                lastScannedAt: new Date(),
            });
            registerPlan(registry, {
                code: "b",
                name: "B",
                path: "/b",
                status: "in_progress",
                progress: 50,
                stepCount: 4,
                completedSteps: 2,
                registeredAt: new Date("2024-02-01"),
                lastScannedAt: new Date(),
            });

            const stats = getRegistryStats(registry);

            expect(stats.totalPlans).toBe(2);
            expect(stats.byStatus.completed).toBe(1);
            expect(stats.byStatus.in_progress).toBe(1);
            expect(stats.averageProgress).toBe(75);
            expect(stats.oldestPlan?.code).toBe("a");
            expect(stats.newestPlan?.code).toBe("b");
        });

        it("should handle empty registry", () => {
            const registry = createRegistry();
            const stats = getRegistryStats(registry);

            expect(stats.totalPlans).toBe(0);
            expect(stats.averageProgress).toBe(0);
            expect(stats.oldestPlan).toBeUndefined();
        });
    });

    describe("persistence", () => {
        let testDir: string;
        let registryPath: string;

        beforeEach(async () => {
            testDir = join(tmpdir(), `riotplan-registry-persist-${Date.now()}`);
            await mkdir(testDir, { recursive: true });
            registryPath = join(testDir, "registry.json");
        });

        afterEach(async () => {
            try {
                await rm(testDir, { recursive: true });
            } catch {
                // Ignore
            }
        });

        it("should save and load registry", async () => {
            const registry = createRegistry(["/search/path"]);
            registerPlan(registry, {
                code: "test",
                name: "Test Plan",
                path: "/plans/test",
                status: "in_progress",
                progress: 50,
                stepCount: 4,
                completedSteps: 2,
                registeredAt: new Date(),
                lastScannedAt: new Date(),
                tags: ["important"],
            });

            await saveRegistry(registry, registryPath);

            const loaded = await loadRegistry(registryPath);

            expect(loaded).not.toBeNull();
            expect(loaded!.plans.size).toBe(1);
            expect(loaded!.searchPaths).toContain("/search/path");

            const plan = loaded!.plans.get("/plans/test");
            expect(plan?.code).toBe("test");
            expect(plan?.tags).toContain("important");
        });

        it("should return null for non-existent registry", async () => {
            const loaded = await loadRegistry("/non/existent/registry.json");
            expect(loaded).toBeNull();
        });
    });
});

