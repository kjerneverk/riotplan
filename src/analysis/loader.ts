import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Analysis, AnalysisMetadata, ElaborationRecord } from "./types.js";

/**
 * Load an analysis from disk
 */
export async function loadAnalysis(planPath: string): Promise<Analysis | null> {
    const analysisPath = join(planPath, "analysis");
    
    // Check if analysis exists
    try {
        await stat(analysisPath);
    } catch {
        return null;
    }
    
    // Load requirements
    let requirements = "";
    try {
        requirements = await readFile(
            join(analysisPath, "REQUIREMENTS.md"),
            "utf-8"
        );
    } catch {
        // No requirements file
    }
    
    // Load philosophy (optional)
    let philosophy: string | undefined;
    try {
        philosophy = await readFile(
            join(analysisPath, "PHILOSOPHY.md"),
            "utf-8"
        );
    } catch {
        // No philosophy file
    }
    
    // Load elaborations
    const elaborations = await loadElaborations(analysisPath);
    
    // Build metadata
    const metadata: AnalysisMetadata = {
        createdAt: new Date(), // Could parse from REQUIREMENTS.md
        updatedAt: new Date(),
        elaborationCount: elaborations.length,
        status: parseAnalysisStatus(requirements),
    };
    
    return {
        path: analysisPath,
        requirements,
        philosophy,
        elaborations,
        metadata,
    };
}

/**
 * Load all elaboration records
 */
async function loadElaborations(analysisPath: string): Promise<ElaborationRecord[]> {
    const promptsDir = join(analysisPath, "prompts");
    const records: ElaborationRecord[] = [];
    
    try {
        const files = await readdir(promptsDir);
        const mdFiles = files.filter(f => f.endsWith(".md")).sort();
        
        for (const file of mdFiles) {
            const content = await readFile(join(promptsDir, file), "utf-8");
            const match = file.match(/^(\d+)-/);
            records.push({
                id: match ? match[1] : file,
                timestamp: new Date(), // Could parse from content
                content,
            });
        }
    } catch {
        // No prompts directory
    }
    
    return records;
}

/**
 * Parse analysis status from requirements content
 */
function parseAnalysisStatus(content: string): "draft" | "ready" | "converted" {
    const statusMatch = content.match(/\*\*Status\*\*\s*\|\s*`(\w+)`/);
    if (statusMatch) {
        const status = statusMatch[1];
        if (status === "ready" || status === "converted") {
            return status;
        }
    }
    return "draft";
}

/**
 * Check if a plan has an analysis
 */
export async function hasAnalysis(planPath: string): Promise<boolean> {
    try {
        await stat(join(planPath, "analysis", "REQUIREMENTS.md"));
        return true;
    } catch {
        return false;
    }
}
