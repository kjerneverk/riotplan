import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";

export interface SavedPrompt {
    id: string;
    timestamp: Date;
    type: "initial" | "elaborate" | "amend";
    content: string;
    metadata?: Record<string, unknown>;
}

/**
 * Save the initial plan prompt
 */
export async function saveInitialPrompt(
    planPath: string,
    planName: string,
    content: string
): Promise<string> {
    const filePath = join(planPath, `${planName}-prompt.md`);
    
    const markdown = `# ${planName}

## Initial Prompt

*Saved: ${new Date().toISOString()}*

---

${content}
`;
    
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, markdown, "utf-8");
    return filePath;
}

/**
 * Save an elaboration prompt to analysis/prompts/
 */
export async function saveElaborationPrompt(
    planPath: string,
    content: string,
    metadata?: Record<string, unknown>
): Promise<string> {
    const promptsDir = join(planPath, "analysis", "prompts");
    await mkdir(promptsDir, { recursive: true });
    
    // Get next number
    const existing = await getPromptFiles(promptsDir);
    const nextNum = existing.length + 1;
    const paddedNum = String(nextNum).padStart(3, "0");
    
    const filePath = join(promptsDir, `${paddedNum}-feedback.md`);
    
    const markdown = `# Elaboration Feedback #${nextNum}

*Saved: ${new Date().toISOString()}*

${metadata ? `## Context\n\n${JSON.stringify(metadata, null, 2)}\n` : ""}
## Feedback

${content}
`;
    
    await writeFile(filePath, markdown, "utf-8");
    return filePath;
}

/**
 * Save an amendment prompt to amendments/
 */
export async function saveAmendmentPrompt(
    planPath: string,
    content: string,
    metadata?: Record<string, unknown>
): Promise<string> {
    const amendmentsDir = join(planPath, "amendments");
    await mkdir(amendmentsDir, { recursive: true });
    
    // Get next number
    const existing = await getPromptFiles(amendmentsDir);
    const nextNum = existing.length + 1;
    const paddedNum = String(nextNum).padStart(3, "0");
    
    const filePath = join(amendmentsDir, `${paddedNum}-feedback.md`);
    
    const markdown = `# Plan Amendment #${nextNum}

*Saved: ${new Date().toISOString()}*

${metadata ? `## Context\n\n${JSON.stringify(metadata, null, 2)}\n` : ""}
## Amendment

${content}
`;
    
    await writeFile(filePath, markdown, "utf-8");
    return filePath;
}

/**
 * Get all prompt files in a directory
 */
async function getPromptFiles(dir: string): Promise<string[]> {
    try {
        const files = await readdir(dir);
        return files.filter(f => f.endsWith(".md")).sort();
    } catch {
        return [];
    }
}

/**
 * Load all elaboration prompts for a plan
 */
export async function loadElaborationPrompts(
    planPath: string
): Promise<SavedPrompt[]> {
    const promptsDir = join(planPath, "analysis", "prompts");
    const files = await getPromptFiles(promptsDir);
    
    const prompts: SavedPrompt[] = [];
    for (const file of files) {
        const content = await readFile(join(promptsDir, file), "utf-8");
        const match = file.match(/^(\d+)-/);
        prompts.push({
            id: match ? match[1] : file,
            timestamp: new Date(), // Could parse from content
            type: "elaborate",
            content,
        });
    }
    return prompts;
}

/**
 * Load all amendment prompts for a plan
 */
export async function loadAmendmentPrompts(
    planPath: string
): Promise<SavedPrompt[]> {
    const amendmentsDir = join(planPath, "amendments");
    const files = await getPromptFiles(amendmentsDir);
    
    const prompts: SavedPrompt[] = [];
    for (const file of files) {
        const content = await readFile(join(amendmentsDir, file), "utf-8");
        const match = file.match(/^(\d+)-/);
        prompts.push({
            id: match ? match[1] : file,
            timestamp: new Date(),
            type: "amend",
            content,
        });
    }
    return prompts;
}
