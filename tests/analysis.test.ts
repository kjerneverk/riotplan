/**
 * Tests for analysis module
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    createAnalysisDirectory,
    loadAnalysis,
    hasAnalysis,
} from "../src/analysis/index.js";

describe("Analysis", () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = join(tmpdir(), `riotplan-analysis-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe("createAnalysisDirectory", () => {
        it("should create analysis directory structure", async () => {
            const planPath = join(testDir, "test-plan");
            
            const result = await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build a thing",
            });
            
            expect(result).toBe(join(planPath, "analysis"));
            
            // Verify structure exists
            const analysisStats = await stat(join(planPath, "analysis"));
            expect(analysisStats.isDirectory()).toBe(true);
            
            const promptsStats = await stat(join(planPath, "analysis", "prompts"));
            expect(promptsStats.isDirectory()).toBe(true);
        });

        it("should create REQUIREMENTS.md with initial prompt", async () => {
            const planPath = join(testDir, "test-plan");
            const prompt = "Build a user authentication system";
            
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: prompt,
            });
            
            const content = await readFile(
                join(planPath, "analysis", "REQUIREMENTS.md"),
                "utf-8"
            );
            expect(content).toContain(prompt);
            expect(content).toContain("# Test Plan - Requirements Analysis");
        });

        it("should include status table in requirements", async () => {
            const planPath = join(testDir, "my-feature");
            
            await createAnalysisDirectory({
                planPath,
                planName: "my-feature",
                initialPrompt: "Add feature",
            });
            
            const content = await readFile(
                join(planPath, "analysis", "REQUIREMENTS.md"),
                "utf-8"
            );
            expect(content).toContain("| **Status** | `draft` |");
            expect(content).toContain("| **Elaborations** | 0 |");
        });

        it("should format plan name as Title Case", async () => {
            const planPath = join(testDir, "my-awesome-feature");
            
            await createAnalysisDirectory({
                planPath,
                planName: "my-awesome-feature",
                initialPrompt: "Build something",
            });
            
            const content = await readFile(
                join(planPath, "analysis", "REQUIREMENTS.md"),
                "utf-8"
            );
            expect(content).toContain("# My Awesome Feature - Requirements Analysis");
        });

        it("should include verification criteria section", async () => {
            const planPath = join(testDir, "test-plan");
            
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build it",
            });
            
            const content = await readFile(
                join(planPath, "analysis", "REQUIREMENTS.md"),
                "utf-8"
            );
            expect(content).toContain("## Verification Criteria");
            expect(content).toContain("### Must Have");
            expect(content).toContain("### Should Have");
            expect(content).toContain("### Could Have");
        });
    });

    describe("loadAnalysis", () => {
        it("should return null when no analysis exists", async () => {
            const result = await loadAnalysis(testDir);
            expect(result).toBeNull();
        });

        it("should load existing analysis", async () => {
            const planPath = join(testDir, "test-plan");
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build a thing",
            });
            
            const analysis = await loadAnalysis(planPath);
            expect(analysis).not.toBeNull();
            expect(analysis?.requirements).toContain("Build a thing");
        });

        it("should return correct path", async () => {
            const planPath = join(testDir, "test-plan");
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build it",
            });
            
            const analysis = await loadAnalysis(planPath);
            expect(analysis?.path).toBe(join(planPath, "analysis"));
        });

        it("should parse status from requirements", async () => {
            const planPath = join(testDir, "test-plan");
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build it",
            });
            
            const analysis = await loadAnalysis(planPath);
            expect(analysis?.metadata.status).toBe("draft");
        });

        it("should detect ready status", async () => {
            const planPath = join(testDir, "test-plan");
            const analysisPath = join(planPath, "analysis");
            await mkdir(analysisPath, { recursive: true });
            
            await writeFile(
                join(analysisPath, "REQUIREMENTS.md"),
                "| **Status** | `ready` |",
                "utf-8"
            );
            
            const analysis = await loadAnalysis(planPath);
            expect(analysis?.metadata.status).toBe("ready");
        });

        it("should load elaborations", async () => {
            const planPath = join(testDir, "test-plan");
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build it",
            });
            
            // Add an elaboration
            await writeFile(
                join(planPath, "analysis", "prompts", "001-feedback.md"),
                "# Feedback\n\nSome feedback content",
                "utf-8"
            );
            
            const analysis = await loadAnalysis(planPath);
            expect(analysis?.elaborations).toHaveLength(1);
            expect(analysis?.elaborations[0].id).toBe("001");
            expect(analysis?.metadata.elaborationCount).toBe(1);
        });

        it("should load philosophy if present", async () => {
            const planPath = join(testDir, "test-plan");
            const analysisPath = join(planPath, "analysis");
            await mkdir(analysisPath, { recursive: true });
            
            await writeFile(
                join(analysisPath, "REQUIREMENTS.md"),
                "Requirements content",
                "utf-8"
            );
            await writeFile(
                join(analysisPath, "PHILOSOPHY.md"),
                "Philosophy content",
                "utf-8"
            );
            
            const analysis = await loadAnalysis(planPath);
            expect(analysis?.philosophy).toBe("Philosophy content");
        });
    });

    describe("hasAnalysis", () => {
        it("should return false when no analysis exists", async () => {
            const result = await hasAnalysis(testDir);
            expect(result).toBe(false);
        });

        it("should return true when analysis exists", async () => {
            const planPath = join(testDir, "test-plan");
            await createAnalysisDirectory({
                planPath,
                planName: "test-plan",
                initialPrompt: "Build it",
            });
            
            const result = await hasAnalysis(planPath);
            expect(result).toBe(true);
        });

        it("should return false when analysis dir exists but no REQUIREMENTS.md", async () => {
            const analysisPath = join(testDir, "analysis");
            await mkdir(analysisPath, { recursive: true });
            
            const result = await hasAnalysis(testDir);
            expect(result).toBe(false);
        });
    });
});
