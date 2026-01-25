import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    parseCriteria,
    parseCriteriaFromContent,
    getCriteriaSummary,
    checkCoverage,
    checkCompletion,
    PRIORITY_WEIGHTS,
    CRITERIA_PATTERNS,
    HEALTH_THRESHOLDS,
} from "../src/verification/index.js";

describe("Verification Constants", () => {
    it("should have correct priority weights", () => {
        expect(PRIORITY_WEIGHTS.must).toBe(1.0);
        expect(PRIORITY_WEIGHTS.should).toBe(0.7);
        expect(PRIORITY_WEIGHTS.could).toBe(0.3);
    });

    it("should have criteria patterns", () => {
        expect(CRITERIA_PATTERNS.checkbox).toBeInstanceOf(RegExp);
        expect(CRITERIA_PATTERNS.mustHaveHeader).toBeInstanceOf(RegExp);
        expect(CRITERIA_PATTERNS.shouldHaveHeader).toBeInstanceOf(RegExp);
        expect(CRITERIA_PATTERNS.couldHaveHeader).toBeInstanceOf(RegExp);
        expect(CRITERIA_PATTERNS.verificationSection).toBeInstanceOf(RegExp);
    });

    it("should have health thresholds", () => {
        expect(HEALTH_THRESHOLDS.coverage.good).toBe(80);
        expect(HEALTH_THRESHOLDS.coverage.warning).toBe(60);
        expect(HEALTH_THRESHOLDS.coverage.critical).toBe(40);
        expect(HEALTH_THRESHOLDS.completion.good).toBe(90);
        expect(HEALTH_THRESHOLDS.completion.warning).toBe(70);
        expect(HEALTH_THRESHOLDS.completion.critical).toBe(50);
    });
});

describe("Criteria Parser", () => {
    describe("parseCriteriaFromContent", () => {
        it("should parse criteria with all priority levels", () => {
            const content = `
# Requirements

## Verification Criteria

### Must Have
- [ ] User authentication endpoint exists
- [ ] Session tokens have 24hr expiry

### Should Have
- [ ] Rate limiting on auth endpoints

### Could Have
- [ ] Remember me functionality
`;
            
            const result = parseCriteriaFromContent(content, "test.md");
            
            expect(result.criteria).toHaveLength(4);
            expect(result.criteria[0].priority).toBe("must");
            expect(result.criteria[0].text).toBe("User authentication endpoint exists");
            expect(result.criteria[2].priority).toBe("should");
            expect(result.criteria[3].priority).toBe("could");
            expect(result.parseErrors).toHaveLength(0);
        });

        it("should handle missing verification criteria section", () => {
            const content = "# Requirements\n\nSome content without criteria.";
            const result = parseCriteriaFromContent(content, "test.md");
            
            expect(result.criteria).toHaveLength(0);
            expect(result.parseErrors).toContain("No 'Verification Criteria' section found");
        });

        it("should handle empty criteria section", () => {
            const content = `
# Requirements

## Verification Criteria

No checkboxes here.
`;
            const result = parseCriteriaFromContent(content, "test.md");
            
            expect(result.criteria).toHaveLength(0);
            expect(result.parseErrors).toContain("No checkbox criteria found in Verification Criteria section");
        });

        it("should default to 'should' priority when no header specified", () => {
            const content = `
# Requirements

## Verification Criteria

- [ ] Some requirement without priority header
`;
            const result = parseCriteriaFromContent(content, "test.md");
            
            expect(result.criteria).toHaveLength(1);
            expect(result.criteria[0].priority).toBe("should");
        });

        it("should handle checked checkboxes", () => {
            const content = `
## Verification Criteria

- [x] Completed requirement
- [ ] Pending requirement
`;
            const result = parseCriteriaFromContent(content, "test.md");
            
            expect(result.criteria).toHaveLength(2);
        });

        it("should generate unique IDs for criteria", () => {
            const content = `
## Verification Criteria

- [ ] First requirement
- [ ] Second requirement
- [ ] First requirement
`;
            const result = parseCriteriaFromContent(content, "test.md");
            
            expect(result.criteria).toHaveLength(3);
            expect(result.criteria[0].id).not.toBe(result.criteria[1].id);
            expect(result.criteria[0].id).not.toBe(result.criteria[2].id);
        });
    });

    describe("getCriteriaSummary", () => {
        it("should count criteria by priority", () => {
            const criteria = [
                { id: "1", text: "Must 1", priority: "must" as const, source: "test.md" },
                { id: "2", text: "Must 2", priority: "must" as const, source: "test.md" },
                { id: "3", text: "Should 1", priority: "should" as const, source: "test.md" },
                { id: "4", text: "Could 1", priority: "could" as const, source: "test.md" },
            ];
            
            const summary = getCriteriaSummary(criteria);
            
            expect(summary.total).toBe(4);
            expect(summary.must).toBe(2);
            expect(summary.should).toBe(1);
            expect(summary.could).toBe(1);
        });

        it("should handle empty criteria list", () => {
            const summary = getCriteriaSummary([]);
            
            expect(summary.total).toBe(0);
            expect(summary.must).toBe(0);
            expect(summary.should).toBe(0);
            expect(summary.could).toBe(0);
        });
    });

    describe("parseCriteria", () => {
        let tempDir: string;

        beforeEach(async () => {
            tempDir = await mkdtemp(join(tmpdir(), "riotplan-test-"));
        });

        afterEach(async () => {
            await rm(tempDir, { recursive: true, force: true });
        });

        it("should read criteria from REQUIREMENTS.md", async () => {
            const analysisDir = join(tempDir, "analysis");
            await mkdir(analysisDir);
            
            const content = `
## Verification Criteria

### Must Have
- [ ] Test requirement
`;
            await writeFile(join(analysisDir, "REQUIREMENTS.md"), content);
            
            const result = await parseCriteria(tempDir);
            
            expect(result.criteria).toHaveLength(1);
            expect(result.criteria[0].text).toBe("Test requirement");
        });

        it("should handle missing REQUIREMENTS.md", async () => {
            const result = await parseCriteria(tempDir);
            
            expect(result.criteria).toHaveLength(0);
            expect(result.parseErrors.length).toBeGreaterThan(0);
        });
    });
});

describe("Coverage Checker", () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "riotplan-test-"));
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("should detect covered criteria", async () => {
        // Setup analysis with criteria
        const analysisDir = join(tempDir, "analysis");
        await mkdir(analysisDir);
        await writeFile(join(analysisDir, "REQUIREMENTS.md"), `
## Verification Criteria

### Must Have
- [ ] Authentication endpoint
- [ ] Password hashing
`);

        // Setup plan with matching steps
        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-auth.md"), `
# Authentication

Implement authentication endpoint with password hashing using bcrypt.
`);

        const report = await checkCoverage(tempDir);
        
        expect(report.totalCriteria).toBe(2);
        expect(report.coverageScore).toBeGreaterThan(0);
    });

    it("should detect missing criteria", async () => {
        const analysisDir = join(tempDir, "analysis");
        await mkdir(analysisDir);
        await writeFile(join(analysisDir, "REQUIREMENTS.md"), `
## Verification Criteria

- [ ] Something completely unrelated to the plan
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-step.md"), `
# Different Topic

This is about something else entirely.
`);

        const report = await checkCoverage(tempDir);
        
        expect(report.missing.length).toBeGreaterThan(0);
    });

    it("should handle plan with no analysis", async () => {
        const report = await checkCoverage(tempDir);
        
        expect(report.totalCriteria).toBe(0);
        expect(report.coverageScore).toBe(100);
    });

    it("should calculate weighted coverage score", async () => {
        const analysisDir = join(tempDir, "analysis");
        await mkdir(analysisDir);
        await writeFile(join(analysisDir, "REQUIREMENTS.md"), `
## Verification Criteria

### Must Have
- [ ] Critical feature

### Could Have
- [ ] Nice to have feature
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-step.md"), `
# Implementation

Implements the critical feature.
`);

        const report = await checkCoverage(tempDir);
        
        // Must have should be covered, could have might not be
        expect(report.byPriority.must.total).toBe(1);
        expect(report.byPriority.could.total).toBe(1);
    });

    it("should generate verification questions", async () => {
        const analysisDir = join(tempDir, "analysis");
        await mkdir(analysisDir);
        await writeFile(join(analysisDir, "REQUIREMENTS.md"), `
## Verification Criteria

- [ ] Missing requirement
`);

        const report = await checkCoverage(tempDir);
        
        expect(report.questions.length).toBeGreaterThan(0);
    });
});

describe("Completion Checker", () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "riotplan-test-"));
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("should detect complete steps", async () => {
        await writeFile(join(tempDir, "STATUS.md"), `
## Step Progress

| Step | Name | Status | Started | Completed | Notes |
|------|------|--------|---------|-----------|-------|
| 01 | Test | ✅ Completed | 2026-01-25 | 2026-01-25 | - |
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-test.md"), `
# Test Step

## Acceptance Criteria

- [x] First criterion
- [x] Second criterion
`);

        const report = await checkCompletion(tempDir);
        
        expect(report.totalSteps).toBe(1);
        expect(report.complete.length).toBe(1);
        expect(report.completionScore).toBeGreaterThan(80);
    });

    it("should detect incomplete steps", async () => {
        await writeFile(join(tempDir, "STATUS.md"), `
| Step | Name | Status |
|------|------|--------|
| 01 | Test | ✅ Completed |
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-test.md"), `
# Test Step

## Acceptance Criteria

- [ ] Unchecked criterion
- [ ] Another unchecked
`);

        const report = await checkCompletion(tempDir);
        
        expect(report.incomplete.length).toBe(1);
    });

    it("should detect partial completion", async () => {
        await writeFile(join(tempDir, "STATUS.md"), `
| Step | Name | Status |
|------|------|--------|
| 01 | Test | 🔄 In Progress |
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-test.md"), `
# Test Step

## Acceptance Criteria

- [x] Done
- [ ] Not done
`);

        const report = await checkCompletion(tempDir);
        
        expect(report.partial.length).toBe(1);
    });

    it("should handle steps without acceptance criteria", async () => {
        await writeFile(join(tempDir, "STATUS.md"), `
| Step | Name | Status |
|------|------|--------|
| 01 | Test | ✅ Completed |
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-test.md"), `
# Test Step

No acceptance criteria section.
`);

        const report = await checkCompletion(tempDir);
        
        expect(report.complete.length).toBe(1);
    });

    it("should collect outstanding items", async () => {
        await writeFile(join(tempDir, "STATUS.md"), `
| Step | Name | Status |
|------|------|--------|
| 01 | Test | ✅ Completed |
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-test.md"), `
# Test Step

## Acceptance Criteria

- [ ] Outstanding item 1
- [ ] Outstanding item 2
`);

        const report = await checkCompletion(tempDir);
        
        expect(report.outstandingItems.length).toBe(2);
    });

    it("should handle plan with no STATUS.md", async () => {
        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-test.md"), `# Test`);

        const report = await checkCompletion(tempDir);
        
        expect(report.totalSteps).toBe(1);
        expect(report.pending.length).toBe(1);
    });

    it("should calculate completion score", async () => {
        await writeFile(join(tempDir, "STATUS.md"), `
| Step | Name | Status |
|------|------|--------|
| 01 | Done | ✅ Completed |
| 02 | Pending | ⬜ Pending |
`);

        const planDir = join(tempDir, "plan");
        await mkdir(planDir);
        await writeFile(join(planDir, "01-done.md"), `
# Done
## Acceptance Criteria
- [x] Complete
`);
        await writeFile(join(planDir, "02-pending.md"), `
# Pending
## Acceptance Criteria
- [ ] Not done
`);

        const report = await checkCompletion(tempDir);
        
        expect(report.completionScore).toBe(50);
    });
});
