import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type {
    StepCompletionResult,
    StepCompletionStatus,
    AcceptanceCriterion,
    CompletionReport,
} from "./types.js";

/**
 * Check completion of plan execution
 */
export async function checkCompletion(planPath: string): Promise<CompletionReport> {
    // Load STATUS.md
    const statusMap = await loadStatusMap(planPath);
    
    // Load step files and extract acceptance criteria
    const stepResults = await loadStepResults(planPath, statusMap);
    
    // Build report
    return buildCompletionReport(stepResults);
}

/**
 * Load step status from STATUS.md
 */
async function loadStatusMap(planPath: string): Promise<Map<number, string>> {
    const statusMap = new Map<number, string>();
    
    try {
        const statusPath = join(planPath, "STATUS.md");
        const content = await readFile(statusPath, "utf-8");
        
        // Parse the step progress table
        // Format: | 01 | Step Name | ✅ Completed | ... |
        const tableMatch = content.match(/\|\s*Step\s*\|\s*Name\s*\|\s*Status[\s\S]*?(?=\n##|\n\n##|$)/i);
        if (tableMatch) {
            const lines = tableMatch[0].split("\n");
            for (const line of lines) {
                const match = line.match(/\|\s*(\d+)\s*\|[^|]+\|\s*([^|]+)\|/);
                if (match) {
                    const stepNum = parseInt(match[1]);
                    const status = match[2].trim();
                    statusMap.set(stepNum, status);
                }
            }
        }
    } catch {
        // STATUS.md doesn't exist
    }
    
    return statusMap;
}

/**
 * Load step files and extract acceptance criteria
 */
async function loadStepResults(
    planPath: string,
    statusMap: Map<number, string>
): Promise<StepCompletionResult[]> {
    const results: StepCompletionResult[] = [];
    const planDir = join(planPath, "plan");
    
    try {
        const files = await readdir(planDir);
        const stepFiles = files.filter(f => /^\d{2}-/.test(f) && f.endsWith(".md")).sort();
        
        for (const file of stepFiles) {
            const stepNum = parseInt(file.slice(0, 2));
            const content = await readFile(join(planDir, file), "utf-8");
            
            const result = analyzeStep(stepNum, content, statusMap.get(stepNum) || "⬜ Pending");
            results.push(result);
        }
    } catch {
        // Plan directory doesn't exist
    }
    
    return results;
}

/**
 * Analyze a single step for completion
 */
function analyzeStep(
    stepNum: number,
    content: string,
    markedStatus: string
): StepCompletionResult {
    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const stepTitle = titleMatch ? titleMatch[1] : `Step ${stepNum}`;
    
    // Extract acceptance criteria
    const criteria = extractAcceptanceCriteria(content, stepNum);
    
    // Determine actual completion status
    const status = determineCompletionStatus(criteria, markedStatus);
    
    return {
        stepNumber: stepNum,
        stepTitle,
        status,
        acceptanceCriteria: criteria,
        markedStatus,
    };
}

/**
 * Extract acceptance criteria from step content
 */
function extractAcceptanceCriteria(content: string, stepNum: number): AcceptanceCriterion[] {
    const criteria: AcceptanceCriterion[] = [];
    
    // Find Acceptance Criteria section
    const sectionMatch = content.match(/##\s*Acceptance\s+Criteria([\s\S]*?)(?=\n##|$)/i);
    if (!sectionMatch) {
        return criteria;
    }
    
    const sectionContent = sectionMatch[1];
    
    // Extract checkbox items
    const checkboxRegex = /^[-*]\s*\[([x ])\]\s*(.+)$/gim;
    let match;
    
    while ((match = checkboxRegex.exec(sectionContent)) !== null) {
        criteria.push({
            text: match[2].trim(),
            checked: match[1].toLowerCase() === "x",
            stepNumber: stepNum,
        });
    }
    
    return criteria;
}

/**
 * Determine actual completion status based on criteria and marked status
 */
function determineCompletionStatus(
    criteria: AcceptanceCriterion[],
    markedStatus: string
): StepCompletionStatus {
    const isMarkedComplete = markedStatus.includes("✅") || markedStatus.toLowerCase().includes("complete");
    const isMarkedPending = markedStatus.includes("⬜") || markedStatus.toLowerCase().includes("pending");
    const isMarkedInProgress = markedStatus.includes("🔄") || markedStatus.toLowerCase().includes("progress");
    const isMarkedSkipped = markedStatus.includes("⏭️") || markedStatus.toLowerCase().includes("skip");
    
    if (isMarkedSkipped) {
        return "skipped";
    }
    
    if (criteria.length === 0) {
        // No criteria to check, trust marked status
        if (isMarkedComplete) return "complete";
        if (isMarkedPending) return "pending";
        return "partial";
    }
    
    const checkedCount = criteria.filter(c => c.checked).length;
    const allChecked = checkedCount === criteria.length;
    const noneChecked = checkedCount === 0;
    
    if (isMarkedComplete) {
        if (allChecked) return "complete";
        if (noneChecked) return "incomplete";  // Marked done but nothing checked
        return "partial";
    }
    
    if (isMarkedInProgress) {
        return "partial";
    }
    
    return "pending";
}

/**
 * Build the completion report
 */
function buildCompletionReport(results: StepCompletionResult[]): CompletionReport {
    const complete = results.filter(r => r.status === "complete");
    const partial = results.filter(r => r.status === "partial");
    const incomplete = results.filter(r => r.status === "incomplete");
    const pending = results.filter(r => r.status === "pending" || r.status === "skipped");
    
    // Calculate completion score
    const totalSteps = results.length;
    const completedSteps = complete.length + partial.length * 0.5;
    const completionScore = totalSteps > 0 
        ? Math.round((completedSteps / totalSteps) * 100) 
        : 100;
    
    // Collect outstanding items
    const outstandingItems: string[] = [];
    
    for (const result of [...incomplete, ...partial]) {
        const unchecked = result.acceptanceCriteria.filter(c => !c.checked);
        for (const criterion of unchecked) {
            outstandingItems.push(`Step ${result.stepNumber}: ${criterion.text}`);
        }
    }
    
    return {
        totalSteps,
        complete,
        partial,
        incomplete,
        pending,
        completionScore,
        outstandingItems,
    };
}
