#!/usr/bin/env node
/**
 * RiotPlan MCP Server Wrapper with Auto-Restart
 * 
 * This wrapper provides resilience by automatically restarting the MCP server
 * if it crashes. It includes:
 * - Automatic restart on crash
 * - Exponential backoff for repeated crashes
 * - Maximum restart attempts to prevent infinite loops
 * - Detailed logging for debugging
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MAX_RESTARTS = 10; // Maximum number of restarts before giving up
const INITIAL_BACKOFF_MS = 1000; // Initial backoff delay (1 second)
const MAX_BACKOFF_MS = 30000; // Maximum backoff delay (30 seconds)
const RESET_WINDOW_MS = 60000; // Reset restart count after 1 minute of stable operation

let restartCount = 0;
let lastRestartTime = 0;
let backoffMs = INITIAL_BACKOFF_MS;

function log(message: string) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [RiotPlan MCP Wrapper] ${message}`);
}

function startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        const serverPath = join(__dirname, 'server.js');
        
        log(`Starting MCP server (attempt ${restartCount + 1}/${MAX_RESTARTS})...`);
        
        const child = spawn('node', [serverPath], {
            stdio: ['inherit', 'inherit', 'inherit'],
            env: { ...process.env, RIOTPLAN_MCP_SERVER: 'true' },
        });

        const startTime = Date.now();
        let hasExited = false;

        child.on('error', (error) => {
            if (!hasExited) {
                hasExited = true;
                log(`Server process error: ${error.message}`);
                reject(error);
            }
        });

        child.on('exit', (code, signal) => {
            if (!hasExited) {
                hasExited = true;
                const uptime = Date.now() - startTime;
                
                if (code === 0) {
                    log(`Server exited normally after ${uptime}ms`);
                    resolve();
                } else if (signal) {
                    log(`Server killed by signal ${signal} after ${uptime}ms`);
                    reject(new Error(`Server killed by signal ${signal}`));
                } else {
                    log(`Server exited with code ${code} after ${uptime}ms`);
                    reject(new Error(`Server exited with code ${code}`));
                }
            }
        });

        // If server runs for more than RESET_WINDOW_MS, reset restart count
        setTimeout(() => {
            if (!hasExited) {
                log(`Server has been stable for ${RESET_WINDOW_MS}ms, resetting restart count`);
                restartCount = 0;
                backoffMs = INITIAL_BACKOFF_MS;
            }
        }, RESET_WINDOW_MS);
    });
}

async function runWithRestart() {
    while (true) {
        try {
            await startServer();
            // If server exits normally, we're done
            log('Server exited normally, shutting down wrapper');
            process.exit(0);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Server crashed: ${errorMessage}`);
            
            // Check if we've exceeded max restarts
            if (restartCount >= MAX_RESTARTS) {
                log(`Maximum restart attempts (${MAX_RESTARTS}) reached, giving up`);
                process.exit(1);
            }
            
            // Increment restart count
            restartCount++;
            
            // Calculate backoff with exponential increase
            const now = Date.now();
            if (now - lastRestartTime < 5000) {
                // If restarting very quickly, increase backoff
                backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
            } else {
                // If it's been a while, use initial backoff
                backoffMs = INITIAL_BACKOFF_MS;
            }
            lastRestartTime = now;
            
            log(`Waiting ${backoffMs}ms before restart...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }
}

// Handle signals to gracefully shut down
process.on('SIGINT', () => {
    log('Received SIGINT, shutting down');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down');
    process.exit(0);
});

// Start the wrapper
log('RiotPlan MCP Server Wrapper starting...');
runWithRestart().catch((error) => {
    log(`Fatal error in wrapper: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
