/**
 * Tests for riotplan-history
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { PlanHistory } from "../../src/types.js";
import {
  createRevision,
  getRevision,
  listRevisions,
  compareRevisions,
  createMilestone,
  getMilestone,
  listMilestones,
  rollbackToMilestone,
  initHistory,
  loadHistory,
  saveHistory,
} from "../../src/index.js";

describe("riotplan-history", () => {
  describe("Revisions", () => {
    let history: PlanHistory;

    beforeEach(() => {
      history = initHistory("0.1");
    });

    it("should create initial history with first revision", () => {
      expect(history.currentVersion).toBe("0.1");
      expect(history.revisions.length).toBe(1);
      expect(history.revisions[0].message).toBe("Initial version");
    });

    it("should create new revision", () => {
      const revision = createRevision(history, "Added new feature");

      expect(revision.version).toBe("0.2");
      expect(revision.message).toBe("Added new feature");
      expect(history.currentVersion).toBe("0.2");
      expect(history.revisions.length).toBe(2);
    });

    it("should create revision with author", () => {
      const revision = createRevision(history, "Bug fix", {
        author: "Test Author",
      });

      expect(revision.author).toBe("Test Author");
    });

    it("should create revision with feedbackId", () => {
      const revision = createRevision(history, "Based on feedback", {
        feedbackId: "feedback-001",
      });

      expect(revision.feedbackId).toBe("feedback-001");
    });

    it("should get revision by version", () => {
      createRevision(history, "Second revision");

      const revision = getRevision(history, "0.1");

      expect(revision).toBeDefined();
      expect(revision!.version).toBe("0.1");
      expect(revision!.index).toBe(0);
      expect(revision!.isCurrent).toBe(false);
    });

    it("should return undefined for unknown version", () => {
      const revision = getRevision(history, "9.9");

      expect(revision).toBeUndefined();
    });

    it("should list all revisions", () => {
      createRevision(history, "Second");
      createRevision(history, "Third");

      const revisions = listRevisions(history);

      expect(revisions.length).toBe(3);
      expect(revisions[0].isCurrent).toBe(false);
      expect(revisions[2].isCurrent).toBe(true);
    });

    it("should compare revisions", () => {
      createRevision(history, "Second");
      createRevision(history, "Third");

      const comparison = compareRevisions(history, "0.1", "0.3");

      expect(comparison).toBeDefined();
      expect(comparison!.from.version).toBe("0.1");
      expect(comparison!.to.version).toBe("0.3");
      expect(comparison!.revisionCount).toBe(2);
    });

    it("should return undefined for invalid comparison", () => {
      const comparison = compareRevisions(history, "0.1", "9.9");

      expect(comparison).toBeUndefined();
    });
  });

  describe("Milestones", () => {
    let history: PlanHistory;

    beforeEach(() => {
      history = initHistory("0.1");
    });

    it("should create milestone", () => {
      const milestone = createMilestone(history, "v1.0", "First release");

      expect(milestone.name).toBe("v1.0");
      expect(milestone.version).toBe("0.1");
      expect(milestone.description).toBe("First release");
      expect(history.milestones?.length).toBe(1);
    });

    it("should get milestone by name", () => {
      createMilestone(history, "v1.0");

      const milestone = getMilestone(history, "v1.0");

      expect(milestone).toBeDefined();
      expect(milestone!.name).toBe("v1.0");
      expect(milestone!.index).toBe(0);
    });

    it("should return undefined for unknown milestone", () => {
      const milestone = getMilestone(history, "unknown");

      expect(milestone).toBeUndefined();
    });

    it("should list all milestones", () => {
      createMilestone(history, "v1.0");
      createRevision(history, "Update");
      createMilestone(history, "v2.0");

      const milestones = listMilestones(history);

      expect(milestones.length).toBe(2);
      expect(milestones[0].name).toBe("v1.0");
      expect(milestones[1].name).toBe("v2.0");
    });

    it("should rollback to milestone", () => {
      createMilestone(history, "v1.0");
      createRevision(history, "Update 1");
      createRevision(history, "Update 2");

      const result = rollbackToMilestone(history, "v1.0");

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe("0.1");
      expect(result.revisionsRolledBack).toBe(2);
      expect(history.currentVersion).toBe("0.1");
    });

    it("should fail rollback for unknown milestone", () => {
      const result = rollbackToMilestone(history, "unknown");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("History Manager", () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = join(tmpdir(), `riotplan-history-test-${Date.now()}`);
      await mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await rm(testDir, { recursive: true, force: true });
    });

    it("should save history to disk", async () => {
      const history = initHistory("1.0");
      createRevision(history, "Update");

      await saveHistory(history, testDir);

      const content = await readFile(
        join(testDir, ".history/HISTORY.json"),
        "utf-8",
      );
      const saved = JSON.parse(content);

      expect(saved.currentVersion).toBe("1.1");
      expect(saved.revisions.length).toBe(2);
    });

    it("should load history from disk", async () => {
      // First save
      const original = initHistory("1.0");
      createMilestone(original, "v1.0");
      await saveHistory(original, testDir);

      // Then load
      const manager = await loadHistory(testDir);

      expect(manager.history.currentVersion).toBe("1.0");
      expect(manager.history.milestones?.length).toBe(1);
    });

    it("should initialize new history if file missing", async () => {
      const manager = await loadHistory(testDir);

      expect(manager.history.currentVersion).toBe("0.1");
      expect(manager.history.revisions.length).toBe(1);
    });

    it("should save via manager", async () => {
      const manager = await loadHistory(testDir);
      createRevision(manager.history, "Update");

      await manager.save();

      const content = await readFile(
        join(testDir, ".history/HISTORY.json"),
        "utf-8",
      );
      const saved = JSON.parse(content);

      expect(saved.revisions.length).toBe(2);
    });
  });
});
