import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerStatusCommands, showCommand, getStatusIcon, outputPlanSummary, outputStepList } from '../src/cli/commands/status.js';

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        green: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        blue: (s: string) => s,
        dim: (s: string) => s,
        bold: (s: string) => s,
    }
}));

// Mock loadPlan
const mockLoadPlan = vi.fn();

vi.mock('../src/index.js', () => ({
    loadPlan: (...args: unknown[]) => mockLoadPlan(...args),
}));

describe('commands-status', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    const mockPlan = {
        metadata: { name: 'Test Plan', code: 'test-plan' },
        state: { 
            status: 'in_progress', 
            progress: 50, 
            currentStep: 2,
            blockers: [{ description: 'Test blocker' }]
        },
        steps: [
            { number: 1, title: 'Step 1', status: 'completed' },
            { number: 2, title: 'Step 2', status: 'in_progress' },
            { number: 3, title: 'Step 3', status: 'pending' },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }) as never);
        
        mockLoadPlan.mockResolvedValue(mockPlan);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe('getStatusIcon', () => {
        it('should return correct icons for all statuses', () => {
            expect(getStatusIcon('pending')).toBe('⬜');
            expect(getStatusIcon('in_progress')).toBe('🔄');
            expect(getStatusIcon('completed')).toBe('✅');
            expect(getStatusIcon('failed')).toBe('❌');
            expect(getStatusIcon('blocked')).toBe('⏸️');
            expect(getStatusIcon('skipped')).toBe('⏭️');
            expect(getStatusIcon('unknown')).toBe('⬜');
        });
    });

    describe('outputPlanSummary', () => {
        it('should output plan summary', () => {
            outputPlanSummary(mockPlan as any);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Plan'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('in_progress'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('50%'));
        });

        it('should output blockers if present', () => {
            outputPlanSummary(mockPlan as any);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Blockers'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test blocker'));
        });

        it('should handle plan without progress', () => {
            const planNoProgress = {
                ...mockPlan,
                state: { ...mockPlan.state, progress: undefined, blockers: [] }
            };
            outputPlanSummary(planNoProgress as any);
            
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('outputStepList', () => {
        it('should output step list with icons', () => {
            outputStepList(mockPlan.steps as any);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('01'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 1'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 2'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 3'));
        });
    });

    describe('registerStatusCommands', () => {
        it('should register status command on program', () => {
            const program = new Command();
            registerStatusCommands(program);
            
            const statusCmd = program.commands.find(cmd => cmd.name() === 'status');
            expect(statusCmd).toBeDefined();
        });

        it('should show plan status', async () => {
            const program = new Command();
            registerStatusCommands(program);
            
            await program.parseAsync(['node', 'test', 'status']);
            
            expect(mockLoadPlan).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should output JSON when --json flag is used', async () => {
            const program = new Command();
            registerStatusCommands(program);
            
            await program.parseAsync(['node', 'test', 'status', '--json']);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"name": "Test Plan"'));
        });

        it('should show verbose output with --verbose flag', async () => {
            const program = new Command();
            registerStatusCommands(program);
            
            await program.parseAsync(['node', 'test', 'status', '--verbose']);
            
            expect(consoleSpy).toHaveBeenCalledWith('Steps:');
        });

        it('should handle load errors', async () => {
            mockLoadPlan.mockRejectedValue(new Error('Load failed'));
            const program = new Command();
            registerStatusCommands(program);
            
            await expect(program.parseAsync(['node', 'test', 'status']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load plan'));
        });
    });

    describe('showCommand', () => {
        it('should create show command', () => {
            const cmd = showCommand();
            
            expect(cmd.name()).toBe('show');
            expect(cmd.description()).toBe('Show plan status');
        });

        it('should show plan status', async () => {
            const cmd = showCommand();
            await cmd.parseAsync(['node', 'test']);
            
            expect(mockLoadPlan).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockLoadPlan.mockRejectedValue(new Error('Show failed'));
            const cmd = showCommand();
            
            await expect(cmd.parseAsync(['node', 'test']))
                .rejects.toThrow('process.exit called');
        });
    });
});
