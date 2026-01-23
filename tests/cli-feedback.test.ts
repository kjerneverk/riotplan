import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerFeedbackCommands } from '../src/cli/commands/feedback.js';

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        green: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        cyan: (s: string) => s,
        dim: (s: string) => s,
        bold: (s: string) => s,
    }
}));

// Mock feedback functions
const mockCreateFeedback = vi.fn();
const mockListFeedback = vi.fn();
const mockGetFeedback = vi.fn();

vi.mock('../src/feedback/index.js', () => ({
    createFeedback: (...args: unknown[]) => mockCreateFeedback(...args),
    listFeedback: (...args: unknown[]) => mockListFeedback(...args),
    getFeedback: (...args: unknown[]) => mockGetFeedback(...args),
}));

describe('commands-feedback', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    const mockRecord = {
        id: 'FB001',
        title: 'Test Feedback',
        platform: 'slack',
        feedback: 'Test feedback content',
        createdAt: new Date('2025-01-14'),
        participants: [{ name: 'User', type: 'human' }],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }) as never);

        mockCreateFeedback.mockResolvedValue({
            record: mockRecord,
        });
        mockListFeedback.mockResolvedValue([mockRecord]);
        mockGetFeedback.mockResolvedValue(mockRecord);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe('registerFeedbackCommands', () => {
        it('should register feedback command group', () => {
            const program = new Command();
            registerFeedbackCommands(program);

            const feedbackCmd = program.commands.find(cmd => cmd.name() === 'feedback');
            expect(feedbackCmd).toBeDefined();
        });

        it('feedback create should create record', async () => {
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'create', 'Test Feedback']);
            expect(mockCreateFeedback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Created feedback'));
        });

        it('feedback create should handle errors', async () => {
            mockCreateFeedback.mockRejectedValue(new Error('Create failed'));
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await expect(program.parseAsync(['node', 'test', 'feedback', 'create', 'Test']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create feedback'));
        });

        it('feedback list should show records', async () => {
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'list']);
            expect(mockListFeedback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Feedback Records'));
        });

        it('feedback list with no records should show message', async () => {
            mockListFeedback.mockResolvedValue([]);
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'list']);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No feedback records'));
        });

        it('feedback list --json should output JSON', async () => {
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'list', '--json']);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"id": "FB001"'));
        });

        it('feedback list should handle errors', async () => {
            mockListFeedback.mockRejectedValue(new Error('List failed'));
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await expect(program.parseAsync(['node', 'test', 'feedback', 'list']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to list feedback'));
        });

        it('feedback show should display record', async () => {
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'show', 'FB001']);
            expect(mockGetFeedback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Feedback'));
        });

        it('feedback show should show feedback content and participants', async () => {
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'show', 'FB001']);
            expect(consoleSpy).toHaveBeenCalledWith('Feedback:');
            expect(consoleSpy).toHaveBeenCalledWith('Participants:');
        });

        it('feedback show not found should error', async () => {
            mockGetFeedback.mockResolvedValue(null);
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await expect(program.parseAsync(['node', 'test', 'feedback', 'show', 'FB999']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
        });

        it('feedback show --json should output JSON', async () => {
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'show', 'FB001', '--json']);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"title": "Test Feedback"'));
        });

        it('feedback show should handle errors', async () => {
            mockGetFeedback.mockRejectedValue(new Error('Show failed'));
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await expect(program.parseAsync(['node', 'test', 'feedback', 'show', 'FB001']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to show feedback'));
        });

        it('feedback show without optional fields should work', async () => {
            mockGetFeedback.mockResolvedValue({
                id: 'FB002',
                title: 'Simple Feedback',
                feedback: 'Simple content',
                createdAt: new Date('2025-01-14'),
                participants: [],
            });
            const program = new Command();
            program.exitOverride();
            registerFeedbackCommands(program);

            await program.parseAsync(['node', 'test', 'feedback', 'show', 'FB002']);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Simple Feedback'));
        });
    });
});
