import { Command } from "commander";
import chalk from "chalk";
import { resolve } from "node:path";
import { checkCoverage, checkCompletion, parseCriteria, getCriteriaSummary } from "../../verification/index.js";
import type { CoverageReport, CompletionReport, StepCompletionResult, VerificationReport } from "../../verification/types.js";

export interface VerifyOptions {
    analysis?: boolean;
    execution?: boolean;
    criteria?: boolean;
    json?: boolean;
}

/**
 * Format coverage report for terminal output
 */
function formatCoverageReport(report: CoverageReport): void {
    console.log(chalk.bold.cyan("\nVerification: Analysis → Plan Alignment"));
    console.log(chalk.cyan("═".repeat(50)));
    
    if (report.totalCriteria === 0) {
        console.log(chalk.yellow("\nNo verification criteria found."));
        if (report.questions.length > 0) {
            console.log(chalk.gray("\nNotes:"));
            for (const note of report.questions) {
                console.log(chalk.gray(`  - ${note}`));
            }
        }
        return;
    }
    
    console.log(chalk.gray("\nChecking requirements coverage...\n"));
    
    // Covered
    if (report.covered.length > 0) {
        console.log(chalk.green(`✅ COVERED (${report.covered.length}):`));
        for (const result of report.covered) {
            const steps = result.matchedSteps.length > 0 
                ? ` → Steps ${result.matchedSteps.join(", ")}` 
                : "";
            console.log(chalk.green(`   • ${result.criterion.text}${steps}`));
        }
        console.log();
    }
    
    // Partial
    if (report.partial.length > 0) {
        console.log(chalk.yellow(`⚠️  PARTIAL (${report.partial.length}):`));
        for (const result of report.partial) {
            const steps = result.matchedSteps.length > 0 
                ? ` → Steps ${result.matchedSteps.join(", ")}` 
                : "";
            console.log(chalk.yellow(`   • ${result.criterion.text}${steps}`));
            if (result.notes) {
                console.log(chalk.gray(`     ${result.notes}`));
            }
        }
        console.log();
    }
    
    // Missing
    if (report.missing.length > 0) {
        console.log(chalk.red(`❌ MISSING (${report.missing.length}):`));
        for (const result of report.missing) {
            const priority = result.criterion.priority === "must" 
                ? chalk.red("[MUST]") 
                : result.criterion.priority === "should" 
                    ? chalk.yellow("[SHOULD]") 
                    : chalk.gray("[COULD]");
            console.log(chalk.red(`   • ${priority} ${result.criterion.text}`));
        }
        console.log();
    }
    
    // Priority breakdown
    console.log(chalk.cyan("Coverage by Priority:"));
    console.log(chalk.gray(`   Must:   ${formatPriorityCoverage(report.byPriority.must)}`));
    console.log(chalk.gray(`   Should: ${formatPriorityCoverage(report.byPriority.should)}`));
    console.log(chalk.gray(`   Could:  ${formatPriorityCoverage(report.byPriority.could)}`));
    console.log();
    
    // Verification questions
    if (report.questions.length > 0) {
        console.log(chalk.cyan("Verification Questions:"));
        for (let i = 0; i < report.questions.length; i++) {
            console.log(chalk.gray(`  ${i + 1}. ${report.questions[i]}`));
        }
        console.log();
    }
    
    // Score
    const scoreColor = report.coverageScore >= 80 
        ? chalk.green 
        : report.coverageScore >= 60 
            ? chalk.yellow 
            : chalk.red;
    console.log(chalk.bold(`Alignment Score: ${scoreColor(report.coverageScore + "%")}`));
}

function formatPriorityCoverage(stats: { total: number; covered: number; partial: number; missing: number }): string {
    if (stats.total === 0) return "N/A";
    const covered = stats.covered + stats.partial;
    const pct = Math.round((covered / stats.total) * 100);
    return `${covered}/${stats.total} (${pct}%)`;
}

/**
 * Format completion report for terminal output
 */
function formatCompletionReport(report: CompletionReport): void {
    console.log(chalk.bold.cyan("\nVerification: Plan → Execution Alignment"));
    console.log(chalk.cyan("═".repeat(50)));
    
    if (report.totalSteps === 0) {
        console.log(chalk.yellow("\nNo steps found in plan."));
        return;
    }
    
    console.log(chalk.gray("\nChecking step completion...\n"));
    
    // Show each step
    const allSteps = [
        ...report.complete,
        ...report.partial,
        ...report.incomplete,
        ...report.pending,
    ].sort((a, b) => a.stepNumber - b.stepNumber);
    
    for (const step of allSteps) {
        formatStepResult(step);
    }
    
    // Summary
    console.log(chalk.cyan("\nSummary:"));
    console.log(chalk.green(`   ✅ Complete: ${report.complete.length}`));
    console.log(chalk.yellow(`   ⚠️  Partial: ${report.partial.length}`));
    console.log(chalk.red(`   ❌ Incomplete: ${report.incomplete.length}`));
    console.log(chalk.gray(`   ⬜ Pending: ${report.pending.length}`));
    console.log();
    
    // Outstanding items
    if (report.outstandingItems.length > 0) {
        console.log(chalk.cyan("Outstanding Items:"));
        for (const item of report.outstandingItems.slice(0, 10)) {
            console.log(chalk.gray(`   • ${item}`));
        }
        if (report.outstandingItems.length > 10) {
            console.log(chalk.gray(`   ... and ${report.outstandingItems.length - 10} more`));
        }
        console.log();
    }
    
    // Score
    const scoreColor = report.completionScore >= 90 
        ? chalk.green 
        : report.completionScore >= 70 
            ? chalk.yellow 
            : chalk.red;
    console.log(chalk.bold(`Execution Completeness: ${scoreColor(report.completionScore + "%")}`));
}

/**
 * Format a single step result
 */
function formatStepResult(step: StepCompletionResult): void {
    const statusIcon = {
        complete: chalk.green("✅"),
        partial: chalk.yellow("⚠️"),
        incomplete: chalk.red("❌"),
        pending: chalk.gray("⬜"),
        skipped: chalk.gray("⏭️"),
    }[step.status];
    
    const stepNum = String(step.stepNumber).padStart(2, "0");
    console.log(`${statusIcon} Step ${stepNum} - ${step.stepTitle}`);
    
    // Show criteria details for non-complete steps
    if (step.status !== "complete" && step.status !== "pending" && step.status !== "skipped") {
        for (const criterion of step.acceptanceCriteria) {
            const icon = criterion.checked ? chalk.green("✅") : chalk.red("❌");
            console.log(chalk.gray(`   ${icon} ${criterion.text}`));
        }
    }
    
    // Special message for incomplete (marked done but not done)
    if (step.status === "incomplete") {
        console.log(chalk.red(`   ⚠️  Marked as ${step.markedStatus} but criteria not met`));
    }
}

/**
 * Run full verification and generate combined report
 */
async function runFullVerification(planPath: string): Promise<VerificationReport> {
    const coverage = await checkCoverage(planPath);
    const completion = await checkCompletion(planPath);
    
    // Calculate overall health
    const healthScore = calculateHealthScore(coverage, completion);
    
    // Generate summary and recommendations
    const summary = generateSummary(coverage, completion);
    const recommendations = generateRecommendations(coverage, completion);
    
    return {
        planPath,
        timestamp: new Date(),
        coverage: coverage.totalCriteria > 0 ? coverage : undefined,
        completion: completion.totalSteps > 0 ? completion : undefined,
        healthScore,
        summary,
        recommendations,
    };
}

function calculateHealthScore(
    coverage: CoverageReport,
    completion: CompletionReport
): number {
    const scores: number[] = [];
    
    if (coverage.totalCriteria > 0) {
        scores.push(coverage.coverageScore);
    }
    
    if (completion.totalSteps > 0) {
        scores.push(completion.completionScore);
    }
    
    if (scores.length === 0) return 100;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function generateSummary(
    coverage: CoverageReport,
    completion: CompletionReport
): string[] {
    const summary: string[] = [];
    
    if (coverage.totalCriteria > 0) {
        summary.push(`Analysis coverage: ${coverage.coverageScore}% (${coverage.covered.length}/${coverage.totalCriteria} criteria)`);
    }
    
    if (completion.totalSteps > 0) {
        summary.push(`Execution progress: ${completion.completionScore}% (${completion.complete.length}/${completion.totalSteps} steps)`);
    }
    
    return summary;
}

function generateRecommendations(
    coverage: CoverageReport,
    completion: CompletionReport
): string[] {
    const recommendations: string[] = [];
    
    // Coverage recommendations
    if (coverage.missing.length > 0) {
        const mustMissing = coverage.missing.filter(r => r.criterion.priority === "must");
        if (mustMissing.length > 0) {
            recommendations.push(`Add plan steps for ${mustMissing.length} missing MUST HAVE criteria`);
        }
    }
    
    // Completion recommendations
    if (completion.incomplete.length > 0) {
        recommendations.push(`Review ${completion.incomplete.length} step(s) marked complete but with unchecked criteria`);
    }
    
    if (completion.outstandingItems.length > 0) {
        recommendations.push(`Address ${completion.outstandingItems.length} outstanding acceptance criteria`);
    }
    
    return recommendations;
}

/**
 * Format the full verification report
 */
function formatFullReport(report: VerificationReport): void {
    console.log(chalk.bold.cyan("\n╔════════════════════════════════════════════════╗"));
    console.log(chalk.bold.cyan("║           PLAN VERIFICATION REPORT             ║"));
    console.log(chalk.bold.cyan("╚════════════════════════════════════════════════╝"));
    console.log(chalk.gray(`\nPath: ${report.planPath}`));
    console.log(chalk.gray(`Time: ${report.timestamp.toISOString()}`));
    
    // Coverage section
    if (report.coverage) {
        formatCoverageReport(report.coverage);
    } else {
        console.log(chalk.gray("\n(No analysis found - skipping coverage check)"));
    }
    
    // Completion section
    if (report.completion) {
        formatCompletionReport(report.completion);
    } else {
        console.log(chalk.gray("\n(No plan steps found - skipping completion check)"));
    }
    
    // Summary
    console.log(chalk.bold.cyan("\n═══════════════════════════════════════════════"));
    console.log(chalk.bold("Summary:"));
    for (const line of report.summary) {
        console.log(chalk.gray(`  • ${line}`));
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
        console.log(chalk.bold("\nRecommendations:"));
        for (const rec of report.recommendations) {
            console.log(chalk.yellow(`  → ${rec}`));
        }
    }
    
    // Health score
    const healthColor = report.healthScore >= 80 
        ? chalk.green 
        : report.healthScore >= 60 
            ? chalk.yellow 
            : chalk.red;
    console.log(chalk.bold(`\nOverall Health: ${healthColor(report.healthScore + "%")}`));
}

/**
 * Display criteria list
 */
async function displayCriteria(planPath: string): Promise<void> {
    const { criteria, parseErrors } = await parseCriteria(planPath);
    const summary = getCriteriaSummary(criteria);
    
    console.log(chalk.bold.cyan("\nVerification Criteria"));
    console.log(chalk.cyan("═".repeat(50)));
    
    if (criteria.length === 0) {
        console.log(chalk.yellow("\nNo criteria found."));
        for (const error of parseErrors) {
            console.log(chalk.gray(`  ${error}`));
        }
        return;
    }
    
    console.log(chalk.gray(`\nTotal: ${summary.total} criteria\n`));
    
    // Group by priority
    const grouped = {
        must: criteria.filter(c => c.priority === "must"),
        should: criteria.filter(c => c.priority === "should"),
        could: criteria.filter(c => c.priority === "could"),
    };
    
    if (grouped.must.length > 0) {
        console.log(chalk.red.bold(`Must Have (${grouped.must.length}):`));
        for (const c of grouped.must) {
            console.log(chalk.gray(`  - ${c.text}`));
        }
        console.log();
    }
    
    if (grouped.should.length > 0) {
        console.log(chalk.yellow.bold(`Should Have (${grouped.should.length}):`));
        for (const c of grouped.should) {
            console.log(chalk.gray(`  - ${c.text}`));
        }
        console.log();
    }
    
    if (grouped.could.length > 0) {
        console.log(chalk.gray.bold(`Could Have (${grouped.could.length}):`));
        for (const c of grouped.could) {
            console.log(chalk.gray(`  - ${c.text}`));
        }
    }
}

/**
 * Register the verify command
 */
export function registerVerifyCommand(program: Command): void {
    program
        .command("verify [path]")
        .description("Verify plan alignment and completion")
        .option("-a, --analysis", "Verify plan covers analysis requirements")
        .option("-e, --execution", "Verify execution is complete")
        .option("-c, --criteria", "Show all verification criteria")
        .option("--json", "Output as JSON")
        .action(async (pathArg: string | undefined, options: VerifyOptions) => {
            try {
                const planPath = resolve(pathArg || process.cwd());
                
                // Handle --criteria flag
                if (options.criteria) {
                    await displayCriteria(planPath);
                    return;
                }
                
                // Determine what to run
                const runAnalysis = options.analysis;
                const runExecution = options.execution;
                const runAll = !runAnalysis && !runExecution;
                
                if (runAll) {
                    // Run full verification
                    const report = await runFullVerification(planPath);
                    
                    if (options.json) {
                        console.log(JSON.stringify(report, null, 2));
                    } else {
                        formatFullReport(report);
                    }
                } else {
                    // Run specific checks
                    if (runAnalysis) {
                        const report = await checkCoverage(planPath);
                        if (options.json) {
                            console.log(JSON.stringify(report, null, 2));
                        } else {
                            formatCoverageReport(report);
                        }
                    }
                    
                    if (runExecution) {
                        const report = await checkCompletion(planPath);
                        if (options.json) {
                            console.log(JSON.stringify(report, null, 2));
                        } else {
                            formatCompletionReport(report);
                        }
                    }
                }
                
            } catch (error) {
                console.error(chalk.red("Verification failed:"), error);
                process.exit(1);
            }
        });
}
