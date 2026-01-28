import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerPlanCommands, initCommand, validateCommand, archiveCommand, templateCommand, templateListCommand, templateShowCommand, templateUseCommand } from '../src/commands/plan/index.js';

// Mock chalk to avoid color codes in tests
vi.mock('chalk', () => ({
    default: {
        green: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        blue: (s: string) => s,
        dim: (s: string) => s,
        bold: (s: string) => s,
        cyan: (s: string) => s,
        white: (s: string) => s,
    }
}));

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
    rename: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('# Status'),
    writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock the riotplan module functions
const mockCreatePlan = vi.fn();
const mockValidatePlan = vi.fn();
const mockLoadPlan = vi.fn();
const mockGenerateStatus = vi.fn();

vi.mock('../src/plan/creator.js', () => ({
    createPlan: (...args: unknown[]) => mockCreatePlan(...args),
}));

vi.mock('../src/plan/validator.js', () => ({
    validatePlan: (...args: unknown[]) => mockValidatePlan(...args),
}));

vi.mock('../src/plan/loader.js', () => ({
    loadPlan: (...args: unknown[]) => mockLoadPlan(...args),
}));

vi.mock('../src/status/generator.js', () => ({
    generateStatus: (...args: unknown[]) => mockGenerateStatus(...args),
}));

// Mock the templates module
const mockListTemplates = vi.fn();
const mockGetTemplate = vi.fn();
const mockApplyTemplate = vi.fn();

vi.mock('../src/templates/index', () => ({
    listTemplates: () => mockListTemplates(),
    getTemplate: (...args: unknown[]) => mockGetTemplate(...args),
    applyTemplate: (...args: unknown[]) => mockApplyTemplate(...args),
}));

describe('commands-plan', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }) as never);
        
        // Default mock implementations
        mockCreatePlan.mockResolvedValue({
            plan: { metadata: { name: 'Test Plan' } },
            path: '/test/path',
            filesCreated: ['file1.md', 'file2.md', 'file3.md'],
        });
        mockValidatePlan.mockResolvedValue({
            valid: true,
            errors: [],
            warnings: [],
            info: [],
            fixable: [],
        });
        mockLoadPlan.mockResolvedValue({
            metadata: { name: 'Test Plan' },
            state: { status: 'completed' },
        });
        mockGenerateStatus.mockReturnValue('# Status');
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe('registerPlanCommands', () => {
        it('should register plan command group on program', () => {
            const program = new Command();
            registerPlanCommands(program);
            
            const planCmd = program.commands.find(cmd => cmd.name() === 'plan');
            expect(planCmd).toBeDefined();
            expect(planCmd?.description()).toBe('Plan management commands');
        });

        it('should register init, validate, and archive subcommands', () => {
            const program = new Command();
            registerPlanCommands(program);
            
            const planCmd = program.commands.find(cmd => cmd.name() === 'plan');
            const subcommands = planCmd?.commands.map(cmd => cmd.name()) ?? [];
            
            expect(subcommands).toContain('init');
            expect(subcommands).toContain('validate');
            expect(subcommands).toContain('archive');
        });
    });

    describe('initCommand', () => {
        it('should create init command with correct options', () => {
            const cmd = initCommand();
            
            expect(cmd.name()).toBe('init');
            expect(cmd.description()).toBe('Create a new plan');
        });

        it('should have required name argument', () => {
            const cmd = initCommand();
            const args = cmd.registeredArguments;
            
            expect(args.length).toBe(1);
            expect(args[0].name()).toBe('name');
            expect(args[0].required).toBe(true);
        });

        it('should call createPlan and output success', async () => {
            const cmd = initCommand();
            await cmd.parseAsync(['node', 'test', 'my-plan']);
            
            expect(mockCreatePlan).toHaveBeenCalledWith(expect.objectContaining({
                code: 'my-plan',
                name: 'My Plan',
            }));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Created plan'));
        });

        it('should handle errors gracefully', async () => {
            mockCreatePlan.mockRejectedValue(new Error('Creation failed'));
            const cmd = initCommand();
            
            await expect(cmd.parseAsync(['node', 'test', 'my-plan']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create plan'));
        });

        it('should create plan with many files', async () => {
            mockCreatePlan.mockResolvedValue({
                plan: { metadata: { name: 'Test Plan' } },
                path: '/test/path',
                filesCreated: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'],
            });
            const cmd = initCommand();
            await cmd.parseAsync(['node', 'test', 'my-plan']);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('and 2 more'));
        });
    });

    describe('validateCommand', () => {
        it('should create validate command with correct options', () => {
            const cmd = validateCommand();
            
            expect(cmd.name()).toBe('validate');
            expect(cmd.description()).toBe('Validate plan structure');
        });

        it('should call validatePlan and output success for valid plan', async () => {
            const cmd = validateCommand();
            await cmd.parseAsync(['node', 'test']);
            
            expect(mockValidatePlan).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Plan is valid'));
        });

        it('should output JSON when --json flag is used', async () => {
            const cmd = validateCommand();
            
            await expect(cmd.parseAsync(['node', 'test', '--json']))
                .rejects.toThrow('process.exit called');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"valid": true'));
        });

        it('should output errors for invalid plan', async () => {
            mockValidatePlan.mockResolvedValue({
                valid: false,
                errors: [{ code: 'ERR001', message: 'Test error' }],
                warnings: [{ code: 'WARN001', message: 'Test warning' }],
                info: [{ message: 'Test info' }],
                fixable: ['fix1'],
            });
            const cmd = validateCommand();
            
            await expect(cmd.parseAsync(['node', 'test']))
                .rejects.toThrow('process.exit called');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERR001'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN001'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test info'));
        });

        it('should handle validation errors', async () => {
            mockValidatePlan.mockRejectedValue(new Error('Validation error'));
            const cmd = validateCommand();
            
            await expect(cmd.parseAsync(['node', 'test']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
        });
    });

    describe('archiveCommand', () => {
        it('should create archive command with correct options', () => {
            const cmd = archiveCommand();
            
            expect(cmd.name()).toBe('archive');
            expect(cmd.description()).toBe('Archive a completed plan');
        });

        it('should archive completed plan', async () => {
            const cmd = archiveCommand();
            await cmd.parseAsync(['node', 'test']);
            
            expect(mockLoadPlan).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Archived'));
        });

        it('should warn for incomplete plan without force', async () => {
            mockLoadPlan.mockResolvedValue({
                metadata: { name: 'Test Plan' },
                state: { status: 'in_progress' },
            });
            const cmd = archiveCommand();
            
            await expect(cmd.parseAsync(['node', 'test']))
                .rejects.toThrow('process.exit called');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not completed'));
        });

        it('should have --mark-complete option', () => {
            const cmd = archiveCommand();
            const options = cmd.options.map((o) => o.long);
            expect(options).toContain('--mark-complete');
        });

        it('should archive with --force flag', async () => {
            mockLoadPlan.mockResolvedValue({
                metadata: { name: 'Test Plan' },
                state: { status: 'in_progress' },
            });
            const cmd = archiveCommand();
            await cmd.parseAsync(['node', 'test', '--force']);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Archived'));
        });

        it('should handle archive errors', async () => {
            mockLoadPlan.mockRejectedValue(new Error('Load failed'));
            const cmd = archiveCommand();
            
            await expect(cmd.parseAsync(['node', 'test']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Archive failed'));
        });
    });

    describe('templateCommand', () => {
        beforeEach(() => {
            mockListTemplates.mockReturnValue([
                {
                    id: 'basic',
                    name: 'Basic Plan',
                    description: 'A simple plan template',
                    category: 'general',
                    tags: ['basic'],
                    steps: [{ title: 'Step 1', description: 'First step' }],
                },
                {
                    id: 'feature',
                    name: 'Feature Development',
                    description: 'For developing features',
                    category: 'development',
                    tags: ['feature', 'development'],
                    steps: [
                        { title: 'Design', description: 'Design step' },
                        { title: 'Implement', description: 'Implement step' },
                    ],
                    phases: [{ name: 'Phase 1', description: 'First phase', steps: [0, 1] }],
                },
            ]);
            mockGetTemplate.mockImplementation((id: string) => {
                const templates = mockListTemplates();
                return templates.find((t: { id: string }) => t.id === id);
            });
            mockApplyTemplate.mockResolvedValue({
                success: true,
                path: '/test/my-plan',
                template: { id: 'basic', name: 'Basic Plan' },
            });
        });

        it('should create template command group', () => {
            const cmd = templateCommand();
            
            expect(cmd.name()).toBe('template');
            expect(cmd.description()).toBe('Manage plan templates');
        });

        it('should register subcommands', () => {
            const cmd = templateCommand();
            const subcommands = cmd.commands.map(c => c.name());
            
            expect(subcommands).toContain('list');
            expect(subcommands).toContain('show');
            expect(subcommands).toContain('use');
        });
    });

    describe('templateListCommand', () => {
        beforeEach(() => {
            mockListTemplates.mockReturnValue([
                {
                    id: 'basic',
                    name: 'Basic Plan',
                    description: 'A simple plan',
                    category: 'general',
                    tags: ['basic'],
                    steps: [{ title: 'Step 1', description: 'First step' }],
                },
            ]);
        });

        it('should list all templates', async () => {
            const cmd = templateListCommand();
            await cmd.parseAsync(['node', 'test']);
            
            expect(mockListTemplates).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('basic'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Basic Plan'));
        });

        it('should show message when no templates found', async () => {
            mockListTemplates.mockReturnValue([]);
            const cmd = templateListCommand();
            await cmd.parseAsync(['node', 'test']);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No templates found'));
        });

        it('should filter by category', async () => {
            mockListTemplates.mockReturnValue([
                { id: 'basic', name: 'Basic', category: 'general', description: 'Test', tags: [], steps: [] },
                { id: 'feature', name: 'Feature', category: 'development', description: 'Test', tags: [], steps: [] },
            ]);
            const cmd = templateListCommand();
            await cmd.parseAsync(['node', 'test', '--category', 'general']);
            
            // Should only show basic, not feature
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('basic'));
        });
    });

    describe('templateShowCommand', () => {
        beforeEach(() => {
            mockGetTemplate.mockImplementation((id: string) => {
                if (id === 'basic') {
                    return {
                        id: 'basic',
                        name: 'Basic Plan',
                        description: 'A simple plan',
                        category: 'general',
                        tags: ['basic', 'simple'],
                        steps: [{ title: 'Step 1', description: 'First step' }],
                    };
                }
                if (id === 'feature') {
                    return {
                        id: 'feature',
                        name: 'Feature Plan',
                        description: 'For features',
                        category: 'development',
                        tags: ['feature'],
                        steps: [{ title: 'Design', description: 'Design it' }],
                        phases: [{ name: 'Phase 1', description: 'First phase', steps: [0] }],
                    };
                }
                return undefined;
            });
        });

        it('should show template details', async () => {
            const cmd = templateShowCommand();
            await cmd.parseAsync(['node', 'test', 'basic']);
            
            expect(mockGetTemplate).toHaveBeenCalledWith('basic');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Basic Plan'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('A simple plan'));
        });

        it('should show phases when defined', async () => {
            const cmd = templateShowCommand();
            await cmd.parseAsync(['node', 'test', 'feature']);
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Phase 1'));
        });

        it('should error for unknown template', async () => {
            mockGetTemplate.mockReturnValue(undefined);
            const cmd = templateShowCommand();
            
            await expect(cmd.parseAsync(['node', 'test', 'unknown']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Template not found'));
        });
    });

    describe('templateUseCommand', () => {
        beforeEach(() => {
            mockApplyTemplate.mockResolvedValue({
                success: true,
                path: '/test/my-plan',
                template: { id: 'basic', name: 'Basic Plan' },
            });
        });

        it('should apply template to create plan', async () => {
            const cmd = templateUseCommand();
            await cmd.parseAsync(['node', 'test', 'basic', 'my-plan']);
            
            expect(mockApplyTemplate).toHaveBeenCalledWith(expect.objectContaining({
                templateId: 'basic',
                code: 'my-plan',
                name: 'My Plan',
            }));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Created plan from template'));
        });

        it('should use custom description', async () => {
            const cmd = templateUseCommand();
            await cmd.parseAsync(['node', 'test', 'basic', 'my-plan', '-d', 'Custom desc']);
            
            expect(mockApplyTemplate).toHaveBeenCalledWith(expect.objectContaining({
                description: 'Custom desc',
            }));
        });

        it('should handle template errors', async () => {
            mockApplyTemplate.mockResolvedValue({
                success: false,
                error: 'Template not found',
            });
            const cmd = templateUseCommand();
            
            await expect(cmd.parseAsync(['node', 'test', 'unknown', 'my-plan']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Template not found'));
        });

        it('should handle unexpected errors', async () => {
            mockApplyTemplate.mockRejectedValue(new Error('Unexpected error'));
            const cmd = templateUseCommand();
            
            await expect(cmd.parseAsync(['node', 'test', 'basic', 'my-plan']))
                .rejects.toThrow('process.exit called');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create plan'));
        });
    });
});
