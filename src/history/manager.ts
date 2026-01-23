/**
 * History Manager
 *
 * Manage plan history storage.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { PlanHistory } from "../types.js";

/**
 * History manager interface
 */
export interface HistoryManager {
  /** History data */
  history: PlanHistory;

  /** Path to history file */
  path: string;

  /** Save history to disk */
  save(): Promise<void>;

  /** Reload history from disk */
  reload(): Promise<void>;
}

/**
 * Default history file name
 */
const HISTORY_FILE = ".history/HISTORY.json";

/**
 * Initialize a new history for a plan
 */
export function initHistory(initialVersion = "0.1"): PlanHistory {
    return {
        revisions: [
            {
                version: initialVersion,
                createdAt: new Date(),
                message: "Initial version",
            },
        ],
        currentVersion: initialVersion,
        milestones: [],
    };
}

/**
 * Load history from disk
 */
export async function loadHistory(planPath: string): Promise<HistoryManager> {
    const historyPath = join(planPath, HISTORY_FILE);

    let history: PlanHistory;

    try {
        const content = await readFile(historyPath, "utf-8");
        const data = JSON.parse(content);

        // Parse dates
        history = {
            ...data,
            revisions: data.revisions.map((r: Record<string, unknown>) => ({
                ...r,
                createdAt: new Date(r.createdAt as string),
            })),
            milestones: data.milestones?.map((m: Record<string, unknown>) => ({
                ...m,
                createdAt: new Date(m.createdAt as string),
            })),
        };
    } catch {
    // Initialize new history if file doesn't exist
        history = initHistory();
    }

    return createHistoryManager(history, historyPath);
}

/**
 * Save history to disk
 */
export async function saveHistory(
    history: PlanHistory,
    planPath: string,
): Promise<void> {
    const historyPath = join(planPath, HISTORY_FILE);

    // Ensure directory exists
    await mkdir(dirname(historyPath), { recursive: true });

    // Serialize with date conversion
    const data = {
        ...history,
        revisions: history.revisions.map((r) => ({
            ...r,
            createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        })),
        milestones: history.milestones?.map((m) => ({
            ...m,
            createdAt:
        m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
        })),
    };

    await writeFile(historyPath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Create a history manager instance
 */
function createHistoryManager(
    history: PlanHistory,
    path: string,
): HistoryManager {
    return {
        history,
        path,
        async save() {
            const planPath = dirname(dirname(path));
            await saveHistory(history, planPath);
        },
        async reload() {
            const planPath = dirname(dirname(path));
            const reloaded = await loadHistory(planPath);
            Object.assign(history, reloaded.history);
        },
    };
}
