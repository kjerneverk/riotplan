/**
 * Tests for riotplan-templates
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  getTemplate,
  listTemplates,
  applyTemplate,
  BasicTemplate,
  FeatureTemplate,
  RefactoringTemplate,
  MigrationTemplate,
  SprintTemplate,
} from "../../src/index.js";

describe("riotplan-templates", () => {
  describe("Template Registry", () => {
    it("should have all built-in templates registered", () => {
      const templates = listTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(5);

      const ids = templates.map((t) => t.id);
      expect(ids).toContain("basic");
      expect(ids).toContain("feature");
      expect(ids).toContain("refactoring");
      expect(ids).toContain("migration");
      expect(ids).toContain("sprint");
    });

    it("should get template by ID", () => {
      const basic = getTemplate("basic");
      expect(basic).toBeDefined();
      expect(basic!.name).toBe("Basic Plan");

      const feature = getTemplate("feature");
      expect(feature).toBeDefined();
      expect(feature!.name).toBe("Feature Development");
    });

    it("should return undefined for unknown template", () => {
      const unknown = getTemplate("non-existent");
      expect(unknown).toBeUndefined();
    });
  });

  describe("Built-in Templates", () => {
    it("BasicTemplate should have correct structure", () => {
      expect(BasicTemplate.id).toBe("basic");
      expect(BasicTemplate.category).toBe("general");
      expect(BasicTemplate.steps.length).toBeGreaterThanOrEqual(2);
    });

    it("FeatureTemplate should have phases", () => {
      expect(FeatureTemplate.id).toBe("feature");
      expect(FeatureTemplate.category).toBe("development");
      expect(FeatureTemplate.phases).toBeDefined();
      expect(FeatureTemplate.phases!.length).toBe(4);
    });

    it("RefactoringTemplate should focus on safety", () => {
      expect(RefactoringTemplate.id).toBe("refactoring");
      expect(RefactoringTemplate.tags).toContain("technical-debt");
      // Should have test coverage step
      const testStep = RefactoringTemplate.steps.find((s) =>
        s.title.includes("Test"),
      );
      expect(testStep).toBeDefined();
    });

    it("MigrationTemplate should have rollback planning", () => {
      expect(MigrationTemplate.id).toBe("migration");
      expect(MigrationTemplate.category).toBe("operations");
      // Should have planning step with rollback
      const planStep = MigrationTemplate.steps.find(
        (s) => s.title === "Planning",
      );
      expect(planStep).toBeDefined();
      expect(planStep!.tasks).toContain("Plan rollback procedures");
    });

    it("SprintTemplate should have agile steps", () => {
      expect(SprintTemplate.id).toBe("sprint");
      expect(SprintTemplate.tags).toContain("agile");
      const stepTitles = SprintTemplate.steps.map((s) => s.title);
      expect(stepTitles).toContain("Sprint Planning");
      expect(stepTitles).toContain("Sprint Retrospective");
    });
  });

  describe("Apply Template", () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = join(tmpdir(), `riotplan-templates-test-${Date.now()}`);
      await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await rm(testDir, { recursive: true, force: true });
    });

    it("should fail for unknown template", async () => {
      const result = await applyTemplate({
        templateId: "non-existent",
        code: "test-plan",
        name: "Test Plan",
        basePath: testDir,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Template not found");
    });

    it("should apply basic template successfully", async () => {
      const result = await applyTemplate({
        templateId: "basic",
        code: "my-plan",
        name: "My Test Plan",
        basePath: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.template).toBeDefined();
      expect(result.template!.id).toBe("basic");

      // Verify plan was created
      const planDir = join(testDir, "my-plan");
      const files = await readdir(planDir);
      expect(files).toContain("SUMMARY.md");
      expect(files).toContain("STATUS.md");
    });

    it("should apply feature template with steps", async () => {
      const result = await applyTemplate({
        templateId: "feature",
        code: "new-feature",
        name: "New Feature",
        basePath: testDir,
      });

      expect(result.success).toBe(true);

      // Verify steps were created (in "plan" subdirectory per PLAN_CONVENTIONS)
      const planDir = join(testDir, "new-feature", "plan");
      const steps = await readdir(planDir);
      // Feature template has 8 steps
      expect(steps.length).toBe(8);
    });

    it("should support custom description", async () => {
      const result = await applyTemplate({
        templateId: "basic",
        code: "custom-plan",
        name: "Custom Plan",
        basePath: testDir,
        description: "My custom description",
      });

      expect(result.success).toBe(true);
    });

    it("should support additional tags", async () => {
      const result = await applyTemplate({
        templateId: "basic",
        code: "tagged-plan",
        name: "Tagged Plan",
        basePath: testDir,
        tags: ["custom-tag", "another-tag"],
      });

      expect(result.success).toBe(true);
    });

    it("should substitute variables in template", async () => {
      const result = await applyTemplate({
        templateId: "basic",
        code: "var-plan",
        name: "Variable Plan",
        basePath: testDir,
        variables: {
          projectName: "MyProject",
          author: "Test Author",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should handle template without variables", async () => {
      const result = await applyTemplate({
        templateId: "basic",
        code: "no-var-plan",
        name: "No Variables Plan",
        basePath: testDir,
        // No variables parameter
      });

      expect(result.success).toBe(true);
    });
  });
});
