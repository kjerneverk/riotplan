/**
 * Feedback Module
 *
 * The philosophical foundation of RiotPlan: preserving deliberation, not just decisions.
 *
 * Feedback records capture:
 * - What was proposed
 * - What feedback was given
 * - What was changed as a result
 * - Why the change was made
 * - Who was involved
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type {
    FeedbackRecord,
    FeedbackParticipant,
    FeedbackPlatform,
    FeedbackContext,
} from "../types.js";
import { PLAN_CONVENTIONS } from "../types.js";

// ===== TYPES =====

/**
 * Options for creating feedback
 */
export interface CreateFeedbackOptions {
    /** Feedback title */
    title: string;

    /** The feedback content */
    feedback: string;

    /** Participants */
    participants?: FeedbackParticipant[];

    /** Platform where feedback occurred */
    platform?: FeedbackPlatform;

    /** What was proposed before feedback */
    proposed?: string;

    /** Discussion/debate content */
    discussion?: string;

    /** Resolution/outcome */
    resolution?: string;

    /** Changes made as a result */
    changes?: string[];

    /** Open questions remaining */
    openQuestions?: string[];

    /** Context references (file:lines) */
    context?: FeedbackContext[];

    /** Plan version this relates to */
    planVersion?: string;
}

/**
 * Result of creating feedback
 */
export interface CreateFeedbackResult {
    /** Created feedback record */
    record: FeedbackRecord;

    /** Path to created file */
    path: string;
}

// ===== MAIN EXPORTS =====

/**
 * Create a new feedback record
 *
 * @param planPath - Path to the plan directory
 * @param options - Feedback options
 * @returns The created feedback record and file path
 *
 * @example
 * ```typescript
 * const result = await createFeedback('./prompts/my-plan', {
 *   title: 'Initial Review',
 *   feedback: 'Consider adding more error handling',
 *   participants: [
 *     { name: 'Tim', type: 'human' },
 *     { name: 'Claude', type: 'ai', model: 'claude-sonnet-4' }
 *   ],
 *   platform: 'cursor'
 * });
 * console.log(result.record.id); // '001'
 * ```
 */
export async function createFeedback(
    planPath: string,
    options: CreateFeedbackOptions
): Promise<CreateFeedbackResult> {
    // Ensure feedback directory exists
    const feedbackDir = join(planPath, PLAN_CONVENTIONS.standardDirs.feedback);
    await mkdir(feedbackDir, { recursive: true });

    // Generate ID and filename
    const id = await getNextFeedbackId(feedbackDir);
    const slug = slugify(options.title);
    const filename = `${id}-${slug}.md`;
    const filePath = join(feedbackDir, filename);

    // Generate content
    const content = generateFeedbackMd(id, options);

    // Write file
    await writeFile(filePath, content);

    // Construct record
    const record: FeedbackRecord = {
        id,
        title: options.title,
        createdAt: new Date(),
        participants: options.participants || [{ name: "Unknown", type: "human" }],
        platform: options.platform || "other",
        feedback: options.feedback,
        proposed: options.proposed,
        discussion: options.discussion,
        resolution: options.resolution,
        changes: options.changes,
        openQuestions: options.openQuestions,
        context: options.context,
        planVersion: options.planVersion,
        filename,
    };

    return { record, path: filePath };
}

/**
 * List all feedback records for a plan
 *
 * @param planPath - Path to the plan directory
 * @returns Array of feedback records sorted by ID
 */
export async function listFeedback(
    planPath: string
): Promise<FeedbackRecord[]> {
    const feedbackDir = join(planPath, PLAN_CONVENTIONS.standardDirs.feedback);

    try {
        const files = await readdir(feedbackDir);
        const records: FeedbackRecord[] = [];

        for (const file of files) {
            if (!PLAN_CONVENTIONS.feedbackPattern.test(file)) continue;

            try {
                const content = await readFile(join(feedbackDir, file), "utf-8");
                const record = parseFeedbackFile(file, content);
                if (record) records.push(record);
            } catch {
                // Skip files that can't be read
            }
        }

        return records.sort((a, b) => a.id.localeCompare(b.id));
    } catch {
        return []; // No feedback directory
    }
}

/**
 * Get a specific feedback record by ID
 *
 * @param planPath - Path to the plan directory
 * @param id - Feedback ID (e.g., '001' or '1')
 * @returns The feedback record or null if not found
 */
export async function getFeedback(
    planPath: string,
    id: string
): Promise<FeedbackRecord | null> {
    const feedbackDir = join(planPath, PLAN_CONVENTIONS.standardDirs.feedback);
    const normalizedId = id.padStart(3, "0");

    try {
        const files = await readdir(feedbackDir);

        for (const file of files) {
            const match = file.match(PLAN_CONVENTIONS.feedbackPattern);
            if (match && match[1] === normalizedId) {
                const content = await readFile(join(feedbackDir, file), "utf-8");
                return parseFeedbackFile(file, content);
            }
        }

        return null;
    } catch {
        return null;
    }
}

// ===== ID GENERATION =====

/**
 * Get the next feedback ID
 */
async function getNextFeedbackId(feedbackDir: string): Promise<string> {
    try {
        const files = await readdir(feedbackDir);
        let maxId = 0;

        for (const file of files) {
            const match = file.match(PLAN_CONVENTIONS.feedbackPattern);
            if (match) {
                const id = parseInt(match[1]);
                if (id > maxId) maxId = id;
            }
        }

        return String(maxId + 1).padStart(3, "0");
    } catch {
        // Directory doesn't exist yet
        return "001";
    }
}

/**
 * Convert a title to a slug
 */
function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50);
}

// ===== FILE GENERATION =====

/**
 * Generate feedback markdown content
 */
function generateFeedbackMd(
    _id: string,
    options: CreateFeedbackOptions
): string {
    const date = new Date().toISOString().split("T")[0];

    let content = `# Feedback: ${options.title}

## Context

- **Date**: ${date}
`;

    // Add participants
    if (options.participants && options.participants.length > 0) {
        const participantStr = options.participants
            .map(
                (p) =>
                    `${p.name} (${p.type}${p.model ? `, ${p.model}` : ""})`
            )
            .join(", ");
        content += `- **Participants**: ${participantStr}\n`;
    }

    // Add platform
    if (options.platform) {
        content += `- **Platform**: ${options.platform}\n`;
    }

    // Add plan version
    if (options.planVersion) {
        content += `- **Plan Version**: ${options.planVersion}\n`;
    }

    // Add file context
    if (options.context && options.context.length > 0) {
        const contextStr = options.context
            .map((c) =>
                c.startLine
                    ? `${c.file}:${c.startLine}-${c.endLine || c.startLine}`
                    : c.file
            )
            .join(", ");
        content += `- **Related Files**: ${contextStr}\n`;
    }

    // What was proposed
    if (options.proposed) {
        content += `
## What Was Proposed

${options.proposed}
`;
    }

    // Feedback given
    content += `
## Feedback Given

${options.feedback}
`;

    // Discussion
    if (options.discussion) {
        content += `
## Discussion

${options.discussion}
`;
    }

    // Resolution
    if (options.resolution) {
        content += `
## Resolution

${options.resolution}
`;
    }

    // Changes made
    if (options.changes && options.changes.length > 0) {
        content += `
## Changes Made

${options.changes.map((c) => `- ${c}`).join("\n")}
`;
    }

    // Open questions
    if (options.openQuestions && options.openQuestions.length > 0) {
        content += `
## Open Questions

${options.openQuestions.map((q) => `- ${q}`).join("\n")}
`;
    }

    return content;
}

// ===== FILE PARSING =====

/**
 * Parse a feedback file into a FeedbackRecord
 */
function parseFeedbackFile(
    filename: string,
    content: string
): FeedbackRecord | null {
    const match = filename.match(PLAN_CONVENTIONS.feedbackPattern);
    if (!match) return null;

    const [, id] = match;

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+Feedback:\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled";

    // Extract date from context
    const dateMatch = content.match(/\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/);
    const createdAt = dateMatch ? new Date(dateMatch[1]) : new Date();

    // Extract platform
    const platformMatch = content.match(/\*\*Platform\*\*:\s*(\w+)/);
    let platform: FeedbackPlatform = "other";
    if (platformMatch) {
        const p = platformMatch[1].toLowerCase();
        const validPlatforms: FeedbackPlatform[] = [
            "cursor",
            "chatgpt",
            "slack",
            "email",
            "meeting",
            "voice",
            "document",
            "other",
        ];
        if (validPlatforms.includes(p as FeedbackPlatform)) {
            platform = p as FeedbackPlatform;
        }
    }

    // Extract plan version
    const versionMatch = content.match(/\*\*Plan Version\*\*:\s*(.+)/);
    const planVersion = versionMatch ? versionMatch[1].trim() : undefined;

    // Extract participants
    const participants: FeedbackParticipant[] = [];
    const participantsMatch = content.match(/\*\*Participants\*\*:\s*(.+)/);
    if (participantsMatch) {
        // Split on "), " to handle participants with models containing commas
        const parts = participantsMatch[1].split(/\),\s*/);
        for (const part of parts) {
            // Add back the closing paren if it was removed by split
            const fullPart = part.endsWith(")") ? part : part + ")";
            const pMatch = fullPart
                .trim()
                .match(/(.+?)\s*\((\w+)(?:,\s*(.+))?\)/);
            if (pMatch) {
                participants.push({
                    name: pMatch[1].trim(),
                    type: pMatch[2] as "human" | "ai",
                    model: pMatch[3]?.trim(),
                });
            }
        }
    }

    // Extract sections
    const feedbackContent = extractSection(content, "Feedback Given");
    const proposed = extractSection(content, "What Was Proposed");
    const discussion = extractSection(content, "Discussion");
    const resolution = extractSection(content, "Resolution");
    const changesSection = extractSection(content, "Changes Made");
    const openQuestionsSection = extractSection(content, "Open Questions");

    // Parse changes as list
    const changes = changesSection
        ? changesSection
            .split("\n")
            .filter((line) => line.trim().startsWith("-"))
            .map((line) => line.trim().replace(/^-\s*/, ""))
        : undefined;

    // Parse open questions as list
    const openQuestions = openQuestionsSection
        ? openQuestionsSection
            .split("\n")
            .filter((line) => line.trim().startsWith("-"))
            .map((line) => line.trim().replace(/^-\s*/, ""))
        : undefined;

    return {
        id,
        title,
        createdAt,
        participants:
            participants.length > 0
                ? participants
                : [{ name: "Unknown", type: "human" }],
        platform,
        feedback: feedbackContent || content,
        proposed,
        discussion,
        resolution,
        changes,
        openQuestions,
        planVersion,
        filename,
    };
}

/**
 * Extract a section from markdown content
 */
function extractSection(
    content: string,
    sectionName: string
): string | undefined {
    const regex = new RegExp(
        `##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
        "i"
    );
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
}

