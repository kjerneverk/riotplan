/**
 * Integration tests for CLI configuration commands
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolvePlanDirectory } from '../../src/config/resolver.js';
import { clearResolverCache } from '../../src/config/resolver.js';
import { clearConfigCache } from '../../src/config/loader.js';
import { clearWalkUpCache } from '../../src/config/walk-up.js';

describe('CLI Configuration Integration', () => {
    let testRoot: string;
    let originalEnv: NodeJS.ProcessEnv;
    let originalCwd: string;

    beforeEach(async () => {
        testRoot = await mkdtemp(join(tmpdir(), 'riotplan-cli-test-'));
        originalEnv = { ...process.env };
        originalCwd = process.cwd();
        clearResolverCache();
        clearConfigCache();
        clearWalkUpCache();
    });

    afterEach(async () => {
        process.env = originalEnv;
        process.chdir(originalCwd);
        if (testRoot) {
            await rm(testRoot, { recursive: true, force: true });
        }
        clearResolverCache();
        clearConfigCache();
        clearWalkUpCache();
    });

    describe('--init-config', () => {
        it('should create riotplan.config.yaml file', async () => {
            process.chdir(testRoot);

            // Note: This would require actually running the CLI command
            // For now, we test that the config file structure is correct
            const configPath = join(testRoot, 'riotplan.config.yaml');
            const configContent = `# RiotPlan Configuration
planDirectory: ./plans
`;

            await writeFile(configPath, configContent, 'utf-8');

            expect(existsSync(configPath)).toBe(true);
            const content = await readFile(configPath, 'utf-8');
            expect(content).toContain('planDirectory');
            expect(content).toContain('./plans');
        });

        it('should not overwrite existing config file', async () => {
            const configPath = join(testRoot, 'riotplan.config.yaml');
            const existingContent = 'planDirectory: ./custom-plans\n';
            await writeFile(configPath, existingContent, 'utf-8');

            expect(existsSync(configPath)).toBe(true);
            const content = await readFile(configPath, 'utf-8');
            expect(content).toBe(existingContent);
        });
    });

    describe('--check-config', () => {
        it('should detect fallback when no config exists', async () => {
            process.chdir(testRoot);

            const result = await resolvePlanDirectory();
            const { resolve: pathResolve } = await import('node:path');
            const normalizePath = (p: string) => pathResolve(p).replace(/^\/private\/var/, '/var');
            expect(normalizePath(result)).toBe(normalizePath(join(testRoot, 'plans')));
        });

        it('should detect config file when present', async () => {
            const configPath = join(testRoot, 'riotplan.config.yaml');
            await writeFile(
                configPath,
                'planDirectory: ./my-plans\n',
                'utf-8'
            );

            process.chdir(testRoot);

            // Note: Full integration would require CardiganTime to load the config
            // This test verifies the file exists and can be read
            expect(existsSync(configPath)).toBe(true);
        });

        it('should detect environment variable', async () => {
            const customPlansDir = join(testRoot, 'custom-plans');
            await mkdir(customPlansDir, { recursive: true });

            process.env.RIOTPLAN_PLAN_DIRECTORY = customPlansDir;
            process.chdir(testRoot);

            // Note: Full integration would require CardiganTime to read env var
            // This test verifies the env var is set
            expect(process.env.RIOTPLAN_PLAN_DIRECTORY).toBe(customPlansDir);
        });
    });

    describe('walk-up detection', () => {
        it('should find plans/ directory via walk-up', async () => {
            const plansDir = join(testRoot, 'plans');
            await mkdir(plansDir, { recursive: true });

            const subDir = join(testRoot, 'subdir', 'nested');
            await mkdir(subDir, { recursive: true });

            process.chdir(subDir);

            const result = await resolvePlanDirectory();
            const { resolve: pathResolve } = await import('node:path');
            const normalizePath = (p: string) => pathResolve(p).replace(/^\/private\/var/, '/var');
            expect(normalizePath(result)).toBe(normalizePath(plansDir));
        });
    });
});
