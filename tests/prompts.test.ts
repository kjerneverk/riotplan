/**
 * Tests for prompt storage utilities
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    saveInitialPrompt,
    saveElaborationPrompt,
    saveAmendmentPrompt,
    loadElaborationPrompts,
    loadAmendmentPrompts,
} from "../src/plan/prompts.js";

describe("Prompt Storage", () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = join(tmpdir(), `riotplan-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe("saveInitialPrompt", () => {
        it("should save initial prompt with correct filename", async () => {
            const planPath = join(testDir, "my-plan");
            const result = await saveInitialPrompt(planPath, "my-plan", "Test description");
            
            expect(result).toBe(join(planPath, "my-plan-prompt.md"));
        });

        it("should create directory if it doesn't exist", async () => {
            const planPath = join(testDir, "nested", "deep", "plan");
            await saveInitialPrompt(planPath, "test-plan", "Description");
            
            const content = await readFile(join(planPath, "test-plan-prompt.md"), "utf-8");
            expect(content).toContain("Description");
        });

        it("should include timestamp in content", async () => {
            const planPath = join(testDir, "test-plan");
            await saveInitialPrompt(planPath, "test-plan", "My plan description");
            
            const content = await readFile(join(planPath, "test-plan-prompt.md"), "utf-8");
            expect(content).toContain("*Saved:");
            expect(content).toMatch(/\d{4}-\d{2}-\d{2}T/);
        });

        it("should include plan name as heading", async () => {
            const planPath = join(testDir, "awesome-plan");
            await saveInitialPrompt(planPath, "awesome-plan", "Description");
            
            const content = await readFile(join(planPath, "awesome-plan-prompt.md"), "utf-8");
            expect(content).toContain("# awesome-plan");
        });

        it("should include the description content", async () => {
            const planPath = join(testDir, "test-plan");
            const description = "This is my detailed plan description\nWith multiple lines";
            await saveInitialPrompt(planPath, "test-plan", description);
            
            const content = await readFile(join(planPath, "test-plan-prompt.md"), "utf-8");
            expect(content).toContain(description);
        });
    });

    describe("saveElaborationPrompt", () => {
        it("should save to analysis/prompts directory", async () => {
            const result = await saveElaborationPrompt(testDir, "Feedback content");
            
            expect(result).toBe(join(testDir, "analysis", "prompts", "001-feedback.md"));
        });

        it("should auto-increment numbers", async () => {
            await saveElaborationPrompt(testDir, "First feedback");
            await saveElaborationPrompt(testDir, "Second feedback");
            await saveElaborationPrompt(testDir, "Third feedback");
            
            const files = await readdir(join(testDir, "analysis", "prompts"));
            expect(files).toContain("001-feedback.md");
            expect(files).toContain("002-feedback.md");
            expect(files).toContain("003-feedback.md");
        });

        it("should include metadata if provided", async () => {
            await saveElaborationPrompt(testDir, "Feedback", { step: 1, context: "test" });
            
            const content = await readFile(
                join(testDir, "analysis", "prompts", "001-feedback.md"),
                "utf-8"
            );
            expect(content).toContain("## Context");
            expect(content).toContain('"step": 1');
        });

        it("should include feedback number in heading", async () => {
            await saveElaborationPrompt(testDir, "Content");
            
            const content = await readFile(
                join(testDir, "analysis", "prompts", "001-feedback.md"),
                "utf-8"
            );
            expect(content).toContain("# Elaboration Feedback #1");
        });
    });

    describe("saveAmendmentPrompt", () => {
        it("should save to amendments directory", async () => {
            const result = await saveAmendmentPrompt(testDir, "Amendment content");
            
            expect(result).toBe(join(testDir, "amendments", "001-feedback.md"));
        });

        it("should auto-increment numbers", async () => {
            await saveAmendmentPrompt(testDir, "First amendment");
            await saveAmendmentPrompt(testDir, "Second amendment");
            
            const files = await readdir(join(testDir, "amendments"));
            expect(files).toContain("001-feedback.md");
            expect(files).toContain("002-feedback.md");
        });

        it("should include metadata if provided", async () => {
            await saveAmendmentPrompt(testDir, "Amendment", { reason: "clarification" });
            
            const content = await readFile(
                join(testDir, "amendments", "001-feedback.md"),
                "utf-8"
            );
            expect(content).toContain("## Context");
            expect(content).toContain('"reason": "clarification"');
        });
    });

    describe("loadElaborationPrompts", () => {
        it("should return empty array when no prompts exist", async () => {
            const prompts = await loadElaborationPrompts(testDir);
            expect(prompts).toEqual([]);
        });

        it("should load all elaboration prompts", async () => {
            await saveElaborationPrompt(testDir, "First");
            await saveElaborationPrompt(testDir, "Second");
            
            const prompts = await loadElaborationPrompts(testDir);
            expect(prompts).toHaveLength(2);
            expect(prompts[0].type).toBe("elaborate");
            expect(prompts[1].type).toBe("elaborate");
        });

        it("should extract ID from filename", async () => {
            await saveElaborationPrompt(testDir, "Content");
            
            const prompts = await loadElaborationPrompts(testDir);
            expect(prompts[0].id).toBe("001");
        });

        it("should include file content", async () => {
            await saveElaborationPrompt(testDir, "My feedback content");
            
            const prompts = await loadElaborationPrompts(testDir);
            expect(prompts[0].content).toContain("My feedback content");
        });
    });

    describe("loadAmendmentPrompts", () => {
        it("should return empty array when no prompts exist", async () => {
            const prompts = await loadAmendmentPrompts(testDir);
            expect(prompts).toEqual([]);
        });

        it("should load all amendment prompts", async () => {
            await saveAmendmentPrompt(testDir, "First");
            await saveAmendmentPrompt(testDir, "Second");
            
            const prompts = await loadAmendmentPrompts(testDir);
            expect(prompts).toHaveLength(2);
            expect(prompts[0].type).toBe("amend");
            expect(prompts[1].type).toBe("amend");
        });

        it("should extract ID from filename", async () => {
            await saveAmendmentPrompt(testDir, "Content");
            
            const prompts = await loadAmendmentPrompts(testDir);
            expect(prompts[0].id).toBe("001");
        });
    });
});
